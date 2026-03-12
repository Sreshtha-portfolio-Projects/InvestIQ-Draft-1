import geminiService from './geminiService';
import { ScreenerFilters } from '../types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export class ScreenerInterpreterService {
  async interpretQuery(query: string): Promise<ScreenerFilters> {
    try {
      const prompt = this.buildScreenerPrompt(query);
      const response = await geminiService.generateStructuredContent(prompt);

      return this.normalizeFilters(response);
    } catch (error) {
      logger.error('Screener interpreter error:', error);
      throw ApiError.internal('Failed to interpret screening query');
    }
  }

  async generateScreenDescription(filters: ScreenerFilters): Promise<string> {
    try {
      const prompt = `Convert these stock screening filters into a natural language description:
${JSON.stringify(filters, null, 2)}

Provide a concise, human-readable description of what stocks this screen is looking for.`;

      const response = await geminiService.generateContent(prompt);
      return response;
    } catch (error) {
      logger.error('Screen description error:', error);
      return 'Custom stock screen';
    }
  }

  private buildScreenerPrompt(query: string): string {
    return `You are a stock screening expert. Convert this natural language query into structured screening filters.

User Query: "${query}"

Available filter criteria:
- pe_ratio: P/E ratio range (e.g., {min: 10, max: 20})
- market_cap: Market cap range in dollars (e.g., {min: 1000000000, max: 10000000000})
- revenue_growth: Revenue growth percentage (e.g., {min: 15})
- roe: Return on equity percentage (e.g., {min: 15})
- debt_to_equity: Debt to equity ratio (e.g., {max: 0.5})
- sector: Industry sector (e.g., "IT", "Banking", "Energy")

Common interpretations:
- "undervalued" → pe_ratio below sector average (typically < 20)
- "high growth" → revenue_growth > 15%
- "strong fundamentals" → roe > 15%, debt_to_equity < 1
- "low debt" → debt_to_equity < 0.5
- "large cap" → market_cap > 10B
- "mid cap" → market_cap 2B-10B
- "small cap" → market_cap < 2B

Return ONLY valid JSON in this format:
{
  "pe_ratio": {"min": number, "max": number},
  "market_cap": {"min": number, "max": number},
  "revenue_growth": {"min": number},
  "roe": {"min": number},
  "debt_to_equity": {"max": number},
  "sector": "string"
}

Only include filters that are relevant to the query. Omit filters that aren't mentioned.`;
  }

  private normalizeFilters(filters: any): ScreenerFilters {
    const normalized: ScreenerFilters = {};

    if (filters.pe_ratio) {
      normalized.pe_ratio = {
        min: filters.pe_ratio.min,
        max: filters.pe_ratio.max,
      };
    }

    if (filters.market_cap) {
      normalized.market_cap = {
        min: filters.market_cap.min,
        max: filters.market_cap.max,
      };
    }

    if (filters.revenue_growth) {
      normalized.revenue_growth = {
        min: filters.revenue_growth.min,
      };
    }

    if (filters.roe) {
      normalized.roe = {
        min: filters.roe.min,
      };
    }

    if (filters.debt_to_equity) {
      normalized.debt_to_equity = {
        max: filters.debt_to_equity.max,
      };
    }

    if (filters.sector) {
      normalized.sector = filters.sector;
    }

    return normalized;
  }

  generateSQLConditions(filters: ScreenerFilters): string[] {
    const conditions: string[] = [];

    if (filters.pe_ratio) {
      if (filters.pe_ratio.min !== undefined) {
        conditions.push(`pe_ratio >= ${filters.pe_ratio.min}`);
      }
      if (filters.pe_ratio.max !== undefined) {
        conditions.push(`pe_ratio <= ${filters.pe_ratio.max}`);
      }
    }

    if (filters.revenue_growth?.min !== undefined) {
      conditions.push(`revenue_growth >= ${filters.revenue_growth.min}`);
    }

    if (filters.roe?.min !== undefined) {
      conditions.push(`roe >= ${filters.roe.min}`);
    }

    if (filters.debt_to_equity?.max !== undefined) {
      conditions.push(`debt_to_equity <= ${filters.debt_to_equity.max}`);
    }

    return conditions;
  }
}

export default new ScreenerInterpreterService();
