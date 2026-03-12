import geminiService from './geminiService';
import { AIResearchResponse } from '../types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export class ResearchAssistantService {
  async analyzeStock(
    ticker: string,
    companyData: any,
    financialData: any,
    userQuery?: string
  ): Promise<AIResearchResponse> {
    try {
      const prompt = this.buildResearchPrompt(ticker, companyData, financialData, userQuery);
      const response = await geminiService.generateStructuredContent(prompt);

      return {
        ticker,
        valuation_summary: response.valuation_summary || '',
        growth_signals: response.growth_signals || [],
        risks: response.risks || [],
        recommendation: response.recommendation || '',
        confidence_level: response.confidence_level || 'medium',
      };
    } catch (error) {
      logger.error('Research assistant error:', error);
      throw ApiError.internal('Failed to generate investment research');
    }
  }

  async compareStocks(ticker1: string, ticker2: string, data1: any, data2: any): Promise<any> {
    try {
      const prompt = this.buildComparisonPrompt(ticker1, ticker2, data1, data2);
      const response = await geminiService.generateStructuredContent(prompt);

      return {
        comparison_summary: response.comparison_summary || '',
        ticker1_strengths: response.ticker1_strengths || [],
        ticker2_strengths: response.ticker2_strengths || [],
        recommendation: response.recommendation || '',
      };
    } catch (error) {
      logger.error('Stock comparison error:', error);
      throw ApiError.internal('Failed to compare stocks');
    }
  }

  async answerQuery(query: string, context: any): Promise<string> {
    try {
      const prompt = this.buildQueryPrompt(query, context);
      const response = await geminiService.generateContent(prompt);
      return response;
    } catch (error) {
      logger.error('Query answer error:', error);
      throw ApiError.internal('Failed to answer query');
    }
  }

  private buildResearchPrompt(
    ticker: string,
    companyData: any,
    financialData: any,
    userQuery?: string
  ): string {
    const basePrompt = `You are an expert investment research analyst. Analyze the following company and provide structured insights.

Company: ${companyData.name} (${ticker})
Sector: ${companyData.sector || 'N/A'}
Market Cap: ${companyData.market_cap ? `$${(companyData.market_cap / 1e9).toFixed(2)}B` : 'N/A'}

Financial Metrics:
- P/E Ratio: ${financialData.pe_ratio || 'N/A'}
- EPS: ${financialData.eps || 'N/A'}
- Revenue Growth: ${financialData.revenue_growth ? `${financialData.revenue_growth}%` : 'N/A'}
- ROE: ${financialData.roe ? `${financialData.roe}%` : 'N/A'}
- Debt to Equity: ${financialData.debt_to_equity || 'N/A'}
- Profit Margin: ${financialData.profit_margin ? `${financialData.profit_margin}%` : 'N/A'}

${userQuery ? `User Question: ${userQuery}\n` : ''}
Provide your analysis in the following JSON format:
{
  "valuation_summary": "Brief assessment of whether the stock is overvalued, undervalued, or fairly valued based on metrics",
  "growth_signals": ["Signal 1", "Signal 2", "Signal 3"],
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "recommendation": "BUY/HOLD/SELL with brief reasoning",
  "confidence_level": "high/medium/low"
}

Focus on fundamental analysis. Be specific and data-driven. Only return valid JSON.`;

    return basePrompt;
  }

  private buildComparisonPrompt(ticker1: string, ticker2: string, data1: any, data2: any): string {
    return `Compare these two stocks as an investment analyst:

Stock 1: ${ticker1}
- P/E Ratio: ${data1.pe_ratio || 'N/A'}
- Revenue Growth: ${data1.revenue_growth || 'N/A'}%
- ROE: ${data1.roe || 'N/A'}%
- Debt/Equity: ${data1.debt_to_equity || 'N/A'}

Stock 2: ${ticker2}
- P/E Ratio: ${data2.pe_ratio || 'N/A'}
- Revenue Growth: ${data2.revenue_growth || 'N/A'}%
- ROE: ${data2.roe || 'N/A'}%
- Debt/Equity: ${data2.debt_to_equity || 'N/A'}

Return comparison in JSON:
{
  "comparison_summary": "Overall comparison summary",
  "ticker1_strengths": ["Strength 1", "Strength 2"],
  "ticker2_strengths": ["Strength 1", "Strength 2"],
  "recommendation": "Which stock is better and why"
}`;
  }

  private buildQueryPrompt(query: string, context: any): string {
    return `You are an investment advisor. Answer this question based on the provided data:

Question: ${query}

Context:
${JSON.stringify(context, null, 2)}

Provide a clear, concise answer focusing on actionable investment insights.`;
  }
}

export default new ResearchAssistantService();
