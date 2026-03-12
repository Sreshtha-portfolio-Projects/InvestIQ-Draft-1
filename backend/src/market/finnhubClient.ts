import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

const BASE_URL = 'https://finnhub.io/api/v1';

// Finnhub uses NSE:TICKER format for Indian exchange symbols
export const toFinnhubSymbol = (ticker: string): string => {
  const upper = ticker.toUpperCase();
  // Already prefixed
  if (upper.includes(':')) return upper;
  return `NSE:${upper}`;
};

interface FinnhubQuoteResponse {
  c: number;   // Current price
  d: number;   // Change
  dp: number;  // Percent change
  h: number;   // High of the day
  l: number;   // Low of the day
  o: number;   // Open price
  pc: number;  // Previous close
  t: number;   // Unix timestamp
}

interface FinnhubProfileResponse {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

interface FinnhubCandleResponse {
  c: number[];  // Close prices
  h: number[];  // High prices
  l: number[];  // Low prices
  o: number[];  // Open prices
  s: string;    // Status: "ok" or "no_data"
  t: number[];  // Unix timestamps
  v: number[];  // Volume
}

interface FinnhubSearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

interface FinnhubMetricResponse {
  metric: {
    '52WeekHigh': number;
    '52WeekLow': number;
    '52WeekLowDate': string;
    '52WeekHighDate': string;
    peBasicExclExtraTTM: number;
    epsTTM: number;
    revenueGrowthTTMYoy: number;
    roeRfy: number;
    totalDebt_totalEquityAnnual: number;
    dividendYieldIndicatedAnnual: number;
    beta: number;
    marketCapitalization: number;
  };
}

class FinnhubClient {
  private client: AxiosInstance;
  private apiKey: string;
  private cache: Map<string, { data: unknown; expiresAt: number }>;
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || '';
    this.cache = new Map();

    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: { 'X-Finnhub-Token': this.apiKey },
    });

    if (!this.apiKey) {
      logger.warn('FINNHUB_API_KEY not set — market data will use fallback mock values');
    }
  }

  private getCacheKey(endpoint: string, params: Record<string, string | number>): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      logger.debug('Cache hit', { key });
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.cacheTTL });
  }

  private async get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as T;

    try {
      const response = await this.client.get<T>(endpoint, { params });
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (err) {
      logger.error('Finnhub API error', { endpoint, params, err });
      return null;
    }
  }

  async getQuote(symbol: string): Promise<FinnhubQuoteResponse | null> {
    return this.get<FinnhubQuoteResponse>('/quote', { symbol: toFinnhubSymbol(symbol) });
  }

  async getProfile(symbol: string): Promise<FinnhubProfileResponse | null> {
    return this.get<FinnhubProfileResponse>('/stock/profile2', { symbol: toFinnhubSymbol(symbol) });
  }

  async getCandles(
    symbol: string,
    resolution: 'D' | 'W' | 'M' = 'D',
    fromTs: number,
    toTs: number
  ): Promise<FinnhubCandleResponse | null> {
    return this.get<FinnhubCandleResponse>('/stock/candle', {
      symbol: toFinnhubSymbol(symbol),
      resolution,
      from: fromTs,
      to: toTs,
    });
  }

  async search(query: string): Promise<FinnhubSearchResult | null> {
    return this.get<FinnhubSearchResult>('/search', { q: query });
  }

  async getMetrics(symbol: string): Promise<FinnhubMetricResponse | null> {
    return this.get<FinnhubMetricResponse>('/stock/metric', {
      symbol: toFinnhubSymbol(symbol),
      metric: 'all',
    });
  }

  // Fetch quotes for a batch of tickers (used for movers / trending)
  async getBatchQuotes(tickers: string[]): Promise<Record<string, FinnhubQuoteResponse>> {
    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        const quote = await this.getQuote(ticker);
        return { ticker, quote };
      })
    );

    const output: Record<string, FinnhubQuoteResponse> = {};
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.quote) {
        output[r.value.ticker] = r.value.quote;
      }
    }
    return output;
  }
}

export const finnhubClient = new FinnhubClient();
export type { FinnhubQuoteResponse, FinnhubProfileResponse, FinnhubCandleResponse, FinnhubMetricResponse };
