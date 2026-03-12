import axios from 'axios';
import config from '../config';
import { StockQuote, MarketIndex } from '../types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export class MarketDataService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.alphaVantage.baseUrl;
    this.apiKey = config.alphaVantage.apiKey;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      const quote = response.data['Global Quote'];

      if (!quote || Object.keys(quote).length === 0) {
        throw ApiError.notFound(`Quote not found for symbol: ${symbol}`);
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previous_close: parseFloat(quote['08. previous close']),
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error fetching quote:', error);
      throw ApiError.internal('Failed to fetch stock quote');
    }
  }

  async getIntradayData(symbol: string, interval: string = '5min'): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol: symbol,
          interval: interval,
          apikey: this.apiKey,
          outputsize: 'compact',
        },
      });

      const timeSeries = response.data[`Time Series (${interval})`];

      if (!timeSeries) {
        throw ApiError.notFound(`Intraday data not found for symbol: ${symbol}`);
      }

      const data = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
        timestamp,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }));

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error fetching intraday data:', error);
      throw ApiError.internal('Failed to fetch intraday data');
    }
  }

  async getDailyData(symbol: string, outputsize: string = 'compact'): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          apikey: this.apiKey,
          outputsize: outputsize,
        },
      });

      const timeSeries = response.data['Time Series (Daily)'];

      if (!timeSeries) {
        throw ApiError.notFound(`Daily data not found for symbol: ${symbol}`);
      }

      const data = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }));

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error fetching daily data:', error);
      throw ApiError.internal('Failed to fetch daily data');
    }
  }

  async getCompanyOverview(symbol: string): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      const overview = response.data;

      if (!overview || !overview.Symbol) {
        throw ApiError.notFound(`Company overview not found for symbol: ${symbol}`);
      }

      return {
        symbol: overview.Symbol,
        name: overview.Name,
        description: overview.Description,
        sector: overview.Sector,
        industry: overview.Industry,
        market_cap: parseInt(overview.MarketCapitalization),
        pe_ratio: parseFloat(overview.PERatio),
        eps: parseFloat(overview.EPS),
        revenue: parseInt(overview.RevenueTTM),
        profit_margin: parseFloat(overview.ProfitMargin),
        roe: parseFloat(overview.ReturnOnEquityTTM),
        debt_to_equity: parseFloat(overview.DebtToEquity),
        week_52_high: parseFloat(overview['52WeekHigh']),
        week_52_low: parseFloat(overview['52WeekLow']),
        dividend_yield: parseFloat(overview.DividendYield),
        beta: parseFloat(overview.Beta),
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error fetching company overview:', error);
      throw ApiError.internal('Failed to fetch company overview');
    }
  }

  async searchSymbol(keywords: string): Promise<any[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: keywords,
          apikey: this.apiKey,
        },
      });

      const matches = response.data.bestMatches || [];

      return matches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        currency: match['8. currency'],
      }));
    } catch (error) {
      logger.error('Error searching symbols:', error);
      throw ApiError.internal('Failed to search symbols');
    }
  }

  async getTopGainersLosers(): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TOP_GAINERS_LOSERS',
          apikey: this.apiKey,
        },
      });

      return {
        top_gainers: response.data.top_gainers?.slice(0, 10).map((item: any) => ({
          ticker: item.ticker,
          price: parseFloat(item.price),
          change_amount: parseFloat(item.change_amount),
          change_percentage: item.change_percentage,
          volume: parseInt(item.volume),
        })) || [],
        top_losers: response.data.top_losers?.slice(0, 10).map((item: any) => ({
          ticker: item.ticker,
          price: parseFloat(item.price),
          change_amount: parseFloat(item.change_amount),
          change_percentage: item.change_percentage,
          volume: parseInt(item.volume),
        })) || [],
        most_actively_traded: response.data.most_actively_traded?.slice(0, 10).map((item: any) => ({
          ticker: item.ticker,
          price: parseFloat(item.price),
          change_amount: parseFloat(item.change_amount),
          change_percentage: item.change_percentage,
          volume: parseInt(item.volume),
        })) || [],
      };
    } catch (error) {
      logger.error('Error fetching top gainers/losers:', error);
      throw ApiError.internal('Failed to fetch market movers');
    }
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    try {
      const indices = ['NIFTY', 'SENSEX', 'SPY'];
      const results = await Promise.allSettled(
        indices.map((symbol) => this.getQuote(symbol))
      );

      const marketIndices: MarketIndex[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const quote = result.value;
          marketIndices.push({
            symbol: quote.symbol,
            name: this.getIndexName(quote.symbol),
            value: quote.price,
            change: quote.change,
            change_percent: quote.change_percent,
          });
        } else {
          logger.warn(`Failed to fetch ${indices[index]}:`, result.reason);
        }
      });

      return marketIndices;
    } catch (error) {
      logger.error('Error fetching market indices:', error);
      throw ApiError.internal('Failed to fetch market indices');
    }
  }

  private getIndexName(symbol: string): string {
    const names: Record<string, string> = {
      NIFTY: 'NIFTY 50',
      SENSEX: 'BSE SENSEX',
      SPY: 'S&P 500',
    };
    return names[symbol] || symbol;
  }
}

export default new MarketDataService();
