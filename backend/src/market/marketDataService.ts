import { finnhubClient } from './finnhubClient';
import { getSupabaseClient } from '../db/supabase';
import { StockQuote, MarketIndex, Company } from '../types';
import { logger } from '../utils/logger';

// Curated list of NSE tickers used for movers & trending
const TRACKED_TICKERS = ['TCS', 'INFY', 'HDFCBANK', 'RELIANCE', 'ICICIBANK', 'WIPRO', 'HCLTECH', 'TATAMOTORS', 'SBIN', 'BAJFINANCE'];

export class MarketDataService {
  async getStockQuote(ticker: string): Promise<StockQuote | null> {
    try {
      const [quoteData, metricsData] = await Promise.allSettled([
        finnhubClient.getQuote(ticker),
        finnhubClient.getMetrics(ticker),
      ]);

      const quote = quoteData.status === 'fulfilled' ? quoteData.value : null;
      const metrics = metricsData.status === 'fulfilled' ? metricsData.value : null;

      // Finnhub returns c:0 when symbol is not found or market is closed
      if (!quote || quote.c === 0) {
        logger.warn('Finnhub quote empty, using mock', { ticker });
        return this.getMockQuote(ticker);
      }

      return {
        ticker: ticker.toUpperCase(),
        price: quote.c,
        change: quote.d,
        change_percent: quote.dp,
        volume: 0, // Finnhub /quote doesn't include volume; use candles for that
        week_52_high: metrics?.metric['52WeekHigh'] ?? quote.h,
        week_52_low: metrics?.metric['52WeekLow'] ?? quote.l,
        pe_ratio: metrics?.metric.peBasicExclExtraTTM ?? undefined,
        eps: metrics?.metric.epsTTM ?? undefined,
      };
    } catch (err) {
      logger.error('Failed to fetch stock quote', { ticker, err });
      return this.getMockQuote(ticker);
    }
  }

  async getCompanyOverview(ticker: string): Promise<Record<string, unknown> | null> {
    try {
      const [profileData, metricsData] = await Promise.allSettled([
        finnhubClient.getProfile(ticker),
        finnhubClient.getMetrics(ticker),
      ]);

      const profile = profileData.status === 'fulfilled' ? profileData.value : null;
      const metrics = metricsData.status === 'fulfilled' ? metricsData.value : null;

      if (!profile || !profile.name) {
        return this.getMockOverview(ticker);
      }

      const m = metrics?.metric;

      // Normalize to a flat structure consumed by the stock detail controller
      return {
        Symbol: ticker.toUpperCase(),
        Name: profile.name,
        Exchange: profile.exchange,
        Sector: profile.finnhubIndustry,
        Industry: profile.finnhubIndustry,
        Description: `${profile.name} is a publicly listed company on ${profile.exchange}.`,
        MarketCapitalization: profile.marketCapitalization
          ? String(Math.round(profile.marketCapitalization * 1e6)) // Finnhub gives cap in millions
          : null,
        '52WeekHigh': m?.['52WeekHigh'] ? String(m['52WeekHigh']) : null,
        '52WeekLow': m?.['52WeekLow'] ? String(m['52WeekLow']) : null,
        PERatio: m?.peBasicExclExtraTTM ? String(m.peBasicExclExtraTTM.toFixed(2)) : null,
        EPS: m?.epsTTM ? String(m.epsTTM.toFixed(2)) : null,
        DividendYield: m?.dividendYieldIndicatedAnnual
          ? String((m.dividendYieldIndicatedAnnual / 100).toFixed(4))
          : null,
        Beta: m?.beta ? String(m.beta.toFixed(2)) : null,
        Logo: profile.logo || null,
        WebURL: profile.weburl || null,
        // Financial metrics for AI context
        RevenueGrowthTTM: m?.revenueGrowthTTMYoy ? String(m.revenueGrowthTTMYoy.toFixed(2)) : null,
        ROE: m?.roeRfy ? String(m.roeRfy.toFixed(2)) : null,
        DebtToEquity: m?.totalDebt_totalEquityAnnual ? String(m.totalDebt_totalEquityAnnual.toFixed(2)) : null,
      };
    } catch (err) {
      logger.error('Failed to fetch company overview', { ticker, err });
      return this.getMockOverview(ticker);
    }
  }

  async getPriceHistory(
    ticker: string
  ): Promise<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]> {
    try {
      const toTs = Math.floor(Date.now() / 1000);
      const fromTs = toTs - 90 * 24 * 60 * 60; // 90 days back

      const candles = await finnhubClient.getCandles(ticker, 'D', fromTs, toTs);

      if (!candles || candles.s !== 'ok' || !candles.t?.length) {
        logger.warn('Finnhub candles empty, using mock', { ticker });
        return this.getMockPriceHistory();
      }

      return candles.t.map((timestamp, i) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: candles.o[i],
        high: candles.h[i],
        low: candles.l[i],
        close: candles.c[i],
        volume: candles.v[i],
      }));
    } catch (err) {
      logger.error('Failed to fetch price history', { ticker, err });
      return this.getMockPriceHistory();
    }
  }

  async searchStocks(query: string): Promise<Company[]> {
    try {
      const supabase = getSupabaseClient();

      // Always search local DB first (fast, no API call needed)
      const { data: dbResults, error } = await supabase
        .from('companies')
        .select('*')
        .or(`ticker.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(10);

      if (!error && dbResults?.length) return dbResults;

      // Fallback: query Finnhub symbol search for unknown tickers
      const searchResults = await finnhubClient.search(query);
      if (!searchResults?.result?.length) return [];

      // Filter to NSE results and map to our Company shape
      return searchResults.result
        .filter((r) => r.symbol.startsWith('NSE:') || r.type === 'EQS')
        .slice(0, 8)
        .map((r) => ({
          id: r.symbol,
          name: r.description,
          ticker: r.displaySymbol.replace('NSE:', ''),
          sector: 'Unknown',
          exchange: 'NSE',
        }));
    } catch (err) {
      logger.error('Stock search failed', err);
      return [];
    }
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    // Finnhub provides index quotes via /quote using index symbols.
    // NIFTY 50 = "NSE:NIFTY", SENSEX = "BSE:SENSEX"
    // These require a premium Finnhub subscription; use live fetch with fallback.
    try {
      const indexSymbols: { symbol: string; name: string }[] = [
        { symbol: 'NSE:NIFTY', name: 'NIFTY 50' },
        { symbol: 'BSE:SENSEX', name: 'SENSEX' },
      ];

      const results = await Promise.allSettled(
        indexSymbols.map(async ({ symbol, name }) => {
          const q = await finnhubClient.getQuote(symbol.replace('NSE:', '').replace('BSE:', ''));
          return { name, q };
        })
      );

      const indices: MarketIndex[] = results
        .filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ name: string; q: { c: number; d: number; dp: number } | null }>).value.q?.c)
        .map((r) => {
          const { name, q } = (r as PromiseFulfilledResult<{ name: string; q: { c: number; d: number; dp: number } }>).value;
          return { name, value: q.c, change: q.d, change_percent: q.dp };
        });

      if (indices.length > 0) return [...indices, ...this.getStaticExtraIndices()];
    } catch {
      // Fall through to static data
    }

    return this.getStaticExtraIndices();
  }

  async getTopMovers(): Promise<{ gainers: StockQuote[]; losers: StockQuote[] }> {
    try {
      // Fetch quotes for the curated tracker list then rank by change_percent
      const quotes = await finnhubClient.getBatchQuotes(TRACKED_TICKERS);

      const mapped: StockQuote[] = Object.entries(quotes)
        .filter(([, q]) => q.c > 0)
        .map(([ticker, q]) => ({
          ticker,
          price: q.c,
          change: q.d,
          change_percent: q.dp,
          volume: 0,
        }));

      if (mapped.length === 0) return this.getMockMovers();

      const sorted = [...mapped].sort((a, b) => b.change_percent - a.change_percent);
      return {
        gainers: sorted.filter((s) => s.change_percent > 0).slice(0, 5),
        losers: sorted.filter((s) => s.change_percent < 0).slice(-5).reverse(),
      };
    } catch (err) {
      logger.error('Failed to fetch top movers', err);
      return this.getMockMovers();
    }
  }

  async getCompanyFinancials(companyId: string): Promise<Record<string, unknown> | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('financials')
        .select('*')
        .eq('company_id', companyId)
        .order('year', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  // ─── Static / mock fallback helpers ───────────────────────────────────────

  private getStaticExtraIndices(): MarketIndex[] {
    return [
      { name: 'NIFTY 50',   value: 22150.45, change: 120.35,  change_percent:  0.55 },
      { name: 'SENSEX',     value: 73200.80, change: 380.20,  change_percent:  0.52 },
      { name: 'NIFTY BANK', value: 48750.30, change: -85.60,  change_percent: -0.18 },
      { name: 'NIFTY IT',   value: 35420.15, change: 245.90,  change_percent:  0.70 },
    ];
  }

  private getMockQuote(ticker: string): StockQuote {
    const basePrice = Math.random() * 3000 + 500;
    const change = (Math.random() - 0.5) * 50;
    return {
      ticker: ticker.toUpperCase(),
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      change_percent: Math.round((change / basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 5_000_000),
      week_52_high: Math.round(basePrice * 1.3 * 100) / 100,
      week_52_low:  Math.round(basePrice * 0.7 * 100) / 100,
    };
  }

  private getMockOverview(ticker: string): Record<string, unknown> {
    return {
      Symbol: ticker.toUpperCase(),
      Name: `${ticker} Ltd`,
      Description: 'A leading company in its sector with strong fundamentals and growth prospects.',
      Sector: 'Technology',
      Industry: 'IT Services',
      MarketCapitalization: '5000000000',
      PERatio: '25.5',
      EPS: '45.20',
      '52WeekHigh': '3200.00',
      '52WeekLow': '2100.00',
      DividendYield: '0.0150',
      Beta: '1.10',
    };
  }

  private getMockPriceHistory() {
    const history = [];
    let price = 2500;
    const now = new Date();

    for (let i = 90; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      price = price * (1 + (Math.random() - 0.48) * 0.02);

      history.push({
        date: date.toISOString().split('T')[0],
        open:   Math.round(price * 0.99 * 100) / 100,
        high:   Math.round(price * 1.01 * 100) / 100,
        low:    Math.round(price * 0.98 * 100) / 100,
        close:  Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 2_000_000 + 500_000),
      });
    }
    return history;
  }

  private getMockMovers(): { gainers: StockQuote[]; losers: StockQuote[] } {
    const gainTickers = ['TCS', 'INFY', 'HDFCBANK', 'RELIANCE', 'WIPRO'];
    const loseTickers = ['ICICIBANK', 'SBIN', 'TATAMOTORS', 'BAJFINANCE', 'HCLTECH'];

    const gainers = gainTickers.map((ticker) => ({
      ticker,
      price: Math.round((Math.random() * 2000 + 500) * 100) / 100,
      change: Math.round((Math.random() * 100 + 10) * 100) / 100,
      change_percent: Math.round((Math.random() * 5 + 1) * 100) / 100,
      volume: Math.floor(Math.random() * 3_000_000),
    }));

    const losers = loseTickers.map((ticker) => {
      const c = Math.random() * 100 + 10;
      const cp = Math.random() * 5 + 1;
      return {
        ticker,
        price: Math.round((Math.random() * 2000 + 500) * 100) / 100,
        change: Math.round(-c * 100) / 100,
        change_percent: Math.round(-cp * 100) / 100,
        volume: Math.floor(Math.random() * 3_000_000),
      };
    });

    return { gainers, losers };
  }
}

export const marketDataService = new MarketDataService();
