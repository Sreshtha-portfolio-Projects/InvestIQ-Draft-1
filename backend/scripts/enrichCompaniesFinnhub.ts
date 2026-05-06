/**
 * Enrich `companies` from Finnhub profile2 (sector, industry, market_cap).
 * Run after NSE ingest. Throttled to reduce API pressure.
 *
 * Usage (from backend/):
 *   npx ts-node scripts/enrichCompaniesFinnhub.ts [limit]
 */

import 'dotenv/config';

import { getSupabaseClient } from '../src/db/supabase';
import { finnhubClient } from '../src/market/finnhubClient';
import { logger } from '../src/utils/logger';

const DELAY_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function enrichBatch(limit: number): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, ticker, sector')
    .order('ticker')
    .limit(limit);

  if (error || !companies?.length) {
    logger.error('Failed to list companies', error);
    return;
  }

  let updated = 0;
  for (const c of companies) {
    const ticker = String(c.ticker).toUpperCase();
    try {
      const profile = await finnhubClient.getProfile(ticker);
      await sleep(DELAY_MS);
      if (!profile?.name) {
        logger.debug('No Finnhub profile', { ticker });
        continue;
      }

      const marketCap =
        profile.marketCapitalization != null
          ? Math.round(profile.marketCapitalization * 1_000_000)
          : null;

      const patch: Record<string, unknown> = {};
      if (profile.name) patch['name'] = profile.name;
      if (profile.finnhubIndustry) {
        patch['sector'] = profile.finnhubIndustry;
        patch['industry'] = profile.finnhubIndustry;
      }
      if (marketCap != null) patch['market_cap'] = marketCap;

      if (Object.keys(patch).length === 0) continue;

      const { error: upErr } = await supabase.from('companies').update(patch).eq('id', c.id);

      if (!upErr) updated += 1;
      else logger.warn('Update failed', { ticker, message: upErr.message });
    } catch (e) {
      logger.warn('Enrich error', { ticker, e });
    }
  }

  logger.info(`Finnhub enrichment done: ${updated} / ${companies.length} rows attempted`);
}

const lim = Math.min(parseInt(process.argv[2] || '500', 10) || 500, 10_000);

enrichBatch(lim).catch((e) => {
  console.error(e);
  process.exit(1);
});
