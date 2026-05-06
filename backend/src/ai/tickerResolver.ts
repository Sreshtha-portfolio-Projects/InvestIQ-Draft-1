/**
 * Hybrid ticker resolution: Supabase companies (primary) → Finnhub symbol search (fallback)
 * → optional legacy substring list. Replaces hardcoded KNOWN_INDIAN_TICKERS as primary source.
 */

import { getSupabaseClient } from '../db/supabase';
import { fuzzySearchCompanies } from '../db/fuzzyCompanySearch';
import { finnhubClient } from '../market/finnhubClient';
import { logger } from '../utils/logger';

/** @deprecated Emergency substring fallback only — not primary resolution */
export const KNOWN_INDIAN_TICKERS = [
  'TCS',
  'INFY',
  'HDFCBANK',
  'RELIANCE',
  'ICICIBANK',
  'WIPRO',
  'HCLTECH',
  'TATAMOTORS',
  'BHARTIARTL',
  'SBIN',
  'MARUTI',
  'ASIANPAINT',
  'HINDUNILVR',
  'BAJFINANCE',
  'SUNPHARMA',
  'LT',
  'AXISBANK',
  'KOTAKBANK',
  'ULTRACEMCO',
  'NESTLEIND',
  'POWERGRID',
  'ITC',
  'ONGC',
  'TITAN',
] as const;

/** Normalized name / typo → canonical NSE-style ticker */
const NORMALIZED_ALIASES: Record<string, string> = {
  INFOSIS: 'INFY',
  INFOSIZ: 'INFY',
  RELAINCE: 'RELIANCE',
  RELIANCEINDUSTRIES: 'RELIANCE',
  TATACONSULTANCYSERVICES: 'TCS',
  INFOSYS: 'INFY',
  HDFC: 'HDFCBANK',
  ICICI: 'ICICIBANK',
  BHARTIAIRTEL: 'BHARTIARTL',
  HCLTECHNOLOGIES: 'HCLTECH',
};

function sanitizeIlikeFragment(s: string): string {
  return s.replace(/[%_\\]/g, '').trim().slice(0, 80);
}

function normalizeKey(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function aliasResolve(token: string): string | undefined {
  const key = normalizeKey(token);
  return NORMALIZED_ALIASES[key];
}

const resolutionCache = new Map<string, { tickers: string[]; expiresAt: number }>();
const RESOLUTION_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_KEYS = 300;

function cacheKey(text: string, limit: number): string {
  return `${limit}:${text.trim().toLowerCase()}`;
}

function getCached(key: string): string[] | null {
  const row = resolutionCache.get(key);
  if (row && Date.now() < row.expiresAt) return row.tickers;
  resolutionCache.delete(key);
  return null;
}

function setCached(key: string, tickers: string[]): void {
  if (resolutionCache.size >= MAX_CACHE_KEYS) {
    const first = resolutionCache.keys().next().value;
    if (first) resolutionCache.delete(first);
  }
  resolutionCache.set(key, { tickers, expiresAt: Date.now() + RESOLUTION_TTL_MS });
}

export function extractCandidatePhrases(text: string): string[] {
  const phrases: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const s = raw.trim();
    if (s.length < 2 || s.length > 120) return;
    const k = s.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    phrases.push(s);
  };

  const cleaned = text.trim();
  if (cleaned) push(cleaned);

  for (const seg of cleaned.split(/\s+vs\.?\s+|\s+or\s+|[,&]/i)) {
    push(seg.replace(/^[\s"'“]+|[\s"'”]+$/g, ''));
  }

  const upperTokens = cleaned.match(/\b[A-Z][A-Z0-9]{1,14}\b/g) || [];
  for (const t of upperTokens) push(t);

  const aliasHit = aliasResolve(cleaned);
  if (aliasHit) push(aliasHit);

  return phrases;
}

async function tryExactTickerInDb(ticker: string): Promise<string | undefined> {
  const t = ticker.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (t.length < 2 || t.length > 20) return undefined;
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('companies').select('ticker').eq('ticker', t).maybeSingle();
    if (data?.ticker) return String(data.ticker).toUpperCase();
  } catch (e) {
    logger.warn('exact ticker db lookup failed', { ticker: t, e });
  }
  return undefined;
}

async function searchDbCompanies(query: string, limit: number): Promise<string[]> {
  const safe = sanitizeIlikeFragment(query);
  if (safe.length < 2) return [];

  const fuzzy = await fuzzySearchCompanies(safe, limit);
  if (fuzzy.length > 0) {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of fuzzy) {
      const tk = row.ticker.toUpperCase();
      if (!seen.has(tk)) {
        seen.add(tk);
        out.push(tk);
        if (out.length >= limit) return out;
      }
    }
    return out;
  }

  const alias = aliasResolve(safe);
  const patterns = alias ? [safe, alias] : [safe];
  const seen = new Set<string>();
  const out: string[] = [];

  try {
    const supabase = getSupabaseClient();
    for (const p of patterns) {
      const { data, error } = await supabase
        .from('companies')
        .select('ticker')
        .or(`ticker.ilike.%${p}%,name.ilike.%${p}%`)
        .limit(limit);

      if (error) {
        logger.warn('DB ilike search failed', { p, error });
        continue;
      }
      for (const row of data ?? []) {
        const tk = String(row.ticker).toUpperCase();
        if (!seen.has(tk)) {
          seen.add(tk);
          out.push(tk);
          if (out.length >= limit) return out;
        }
      }
    }
  } catch (err) {
    logger.error('searchDbCompanies', err);
  }

  return out;
}

export interface FinnhubSymbolRow {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

function isIndianListing(row: FinnhubSymbolRow): boolean {
  const sym = (row.symbol || '').toUpperCase();
  if (sym.startsWith('NSE:') || sym.startsWith('BSE:')) return true;
  if (/\.(NS|BO)$/i.test(sym)) return true;
  return false;
}

export function normalizeExchangeSymbol(symbol: string, displaySymbol?: string): string | null {
  const s = symbol.trim();
  if (!s) return null;

  if (s.includes(':')) {
    const rest = s.split(':').slice(1).join(':');
    const base = rest.split('.')[0];
    if (base && /^[A-Z0-9-]+$/i.test(base)) return base.toUpperCase().replace(/-/g, '');
  }

  if (/\.(NS|BO)$/i.test(s)) {
    const stripped = s.replace(/\.(NS|BO)$/i, '');
    const base = stripped.includes('.') ? (stripped.split('.').pop() ?? stripped) : stripped;
    return base.toUpperCase();
  }

  if (displaySymbol && /^[A-Z0-9.-]+$/i.test(displaySymbol)) {
    return displaySymbol
      .toUpperCase()
      .replace(/^NSE:/, '')
      .replace(/^BSE:/, '')
      .replace(/\.(NS|BO)$/i, '');
  }

  return null;
}

async function searchFinnhubIndianSymbols(query: string, limit: number): Promise<string[]> {
  const safe = query.trim().slice(0, 80);
  if (safe.length < 2) return [];

  try {
    const res = await finnhubClient.search(safe);
    if (!res?.result?.length) return [];

    const out: string[] = [];
    const seen = new Set<string>();

    for (const r of res.result as FinnhubSymbolRow[]) {
      if (!isIndianListing(r)) continue;
      const base = normalizeExchangeSymbol(r.symbol, r.displaySymbol);
      if (!base || base.length < 2 || seen.has(base)) continue;
      seen.add(base);
      out.push(base);
      if (out.length >= limit) break;
    }

    return out;
  } catch (err) {
    logger.error('Finnhub symbol search failed', { query: safe, err });
    return [];
  }
}

/** Exported alias — Finnhub `/search`, Indian listings only */
export const searchFinnhubSymbols = searchFinnhubIndianSymbols;

function legacySubstringFallback(text: string, limit: number): string[] {
  const upper = text.toUpperCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of KNOWN_INDIAN_TICKERS) {
    if (upper.includes(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/**
 * Hybrid resolution: DB first per phrase → Finnhub if still short → legacy list.
 */
export async function resolveTickersFromText(text: string, limit = 5): Promise<string[]> {
  const key = cacheKey(text, limit);
  const hit = getCached(key);
  if (hit) return hit.slice(0, limit);

  const candidates = extractCandidatePhrases(text);
  const orderedCandidates: string[] = [];
  const candSeen = new Set<string>();
  for (const c of candidates) {
    const parts = [c];
    const al = aliasResolve(c);
    if (al && !parts.includes(al)) parts.push(al);
    for (const p of parts) {
      const k = p.toLowerCase();
      if (candSeen.has(k)) continue;
      candSeen.add(k);
      orderedCandidates.push(p);
    }
  }

  const seen = new Set<string>();
  const out: string[] = [];

  const pushMany = (arr: string[]): boolean => {
    for (const t of arr) {
      const u = t.toUpperCase();
      if (u.length < 2 || seen.has(u)) continue;
      seen.add(u);
      out.push(u);
      if (out.length >= limit) return true;
    }
    return false;
  };

  for (const phrase of orderedCandidates) {
    if (out.length >= limit) break;

    const looksLikeTicker = /^[A-Z0-9]{2,15}$/.test(phrase.trim().toUpperCase());
    if (looksLikeTicker) {
      const exact = await tryExactTickerInDb(phrase);
      if (exact) {
        pushMany([exact]);
        continue;
      }
    }

    const dbHits = await searchDbCompanies(phrase, limit);
    pushMany(dbHits);
  }

  if (out.length >= limit) {
    setCached(key, out);
    return out.slice(0, limit);
  }

  if (out.length < limit) {
    const finnhubNeeded = new Set<string>();
    for (const phrase of orderedCandidates) {
      if (finnhubNeeded.size > 8) break;
      finnhubNeeded.add(phrase);
    }

    for (const phrase of finnhubNeeded) {
      if (out.length >= limit) break;
      const fh = await searchFinnhubIndianSymbols(phrase, limit);
      pushMany(fh);
    }

    if (out.length < limit) {
      const fhFull = await searchFinnhubIndianSymbols(text.trim().slice(0, 80), limit);
      pushMany(fhFull);
    }
  }

  if (out.length === 0) {
    const legacy = legacySubstringFallback(text, limit);
    setCached(key, legacy);
    return legacy;
  }

  setCached(key, out);
  return out.slice(0, limit);
}

export async function extractTickersFromText(text: string, limit = 5): Promise<string[]> {
  return resolveTickersFromText(text, limit);
}

export async function extractFirstTicker(text: string): Promise<string | undefined> {
  const a = await resolveTickersFromText(text, 1);
  return a[0];
}

export const resolveFirstTicker = extractFirstTicker;
