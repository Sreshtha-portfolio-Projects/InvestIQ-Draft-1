/**
 * Ingest NSE equity list CSV into Supabase `companies`.
 *
 * Download a current NSE listed securities CSV (EQ segment) and save as e.g. backend/data/nse_equity.csv
 * Expected columns (case-insensitive): SYMBOL, NAME OF COMPANY | COMPANY | NAME, optional SERIES (filter EQ)
 *
 * Usage (from backend/):
 *   npx ts-node scripts/ingestNSE.ts ./data/nse_equity.sample.csv
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

import { getSupabaseClient } from '../src/db/supabase';
import { logger } from '../src/utils/logger';

function normKey(k: string): string {
  return k.replace(/\s+/g, ' ').trim().toUpperCase();
}

function pickSymbol(row: Record<string, string>): string | undefined {
  const keys = Object.keys(row);
  for (const k of keys) {
    if (normKey(k) === 'SYMBOL') return row[k]?.trim();
  }
  for (const k of keys) {
    if (/^symbol$/i.test(k)) return row[k]?.trim();
  }
  return undefined;
}

function pickName(row: Record<string, string>): string | undefined {
  const keys = Object.keys(row);
  for (const k of keys) {
    const nk = normKey(k);
    if (nk === 'NAME OF COMPANY' || nk === 'NAME OF COMPANY ' || nk === 'COMPANY NAME') return row[k]?.trim();
  }
  for (const k of keys) {
    if (/^(name|company|security name|securityname)$/i.test(k.trim())) return row[k]?.trim();
  }
  return undefined;
}

function pickSeries(row: Record<string, string>): string | undefined {
  const keys = Object.keys(row);
  for (const k of keys) {
    if (/^series$/i.test(k)) return row[k]?.trim();
  }
  return undefined;
}

export function buildAliases(symbol: string, companyName: string): string[] {
  const sym = (symbol || '').trim();
  const name = (companyName || '').trim();
  const stripped = name
    .replace(/\b(limited|ltd\.?|ltd|pvt\.?|private|plc)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const set = new Set<string>();
  for (const s of [name, sym, stripped, name.toLowerCase(), sym.toLowerCase(), stripped.toLowerCase()]) {
    if (s) set.add(s);
  }
  return [...set];
}

interface CompanyRow {
  name: string;
  ticker: string;
  exchange: string;
  industry: string | null;
  aliases: string[];
}

async function ingestNSEStocks(csvPath: string): Promise<void> {
  const absolute = path.resolve(csvPath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`File not found: ${absolute}`);
  }

  const rows: CompanyRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(absolute)
      .pipe(csv())
      .on('data', (data: Record<string, string>) => {
        const sym = pickSymbol(data);
        const nm = pickName(data);
        const series = pickSeries(data);
        if (series && series.toUpperCase() !== 'EQ') return;
        if (!sym || !nm) return;

        rows.push({
          name: nm,
          ticker: sym.toUpperCase().replace(/[^A-Z0-9]/g, ''),
          exchange: 'NSE',
          industry: null,
          aliases: buildAliases(sym, nm),
        });
      })
      .on('end', () => resolve())
      .on('error', reject);
  });

  if (rows.length === 0) {
    logger.warn('No rows parsed — check CSV columns SYMBOL and company name');
    return;
  }

  const supabase = getSupabaseClient();
  const chunkSize = 250;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('companies').upsert(slice, { onConflict: 'ticker' });
    if (error) {
      logger.error('Upsert chunk failed', { i, message: error.message });
      throw error;
    }
    inserted += slice.length;
    logger.info(`Upserted ${inserted} / ${rows.length}`);
  }

  logger.info(`NSE ingest complete: ${inserted} companies`);
}

const fileArg = process.argv[2] || path.join(process.cwd(), 'data/nse_equity.sample.csv');

ingestNSEStocks(fileArg).catch((e) => {
  console.error(e);
  process.exit(1);
});
