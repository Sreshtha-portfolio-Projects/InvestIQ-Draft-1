import geminiService from './geminiService';
import { EarningsAnalysis } from '../types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

export class EarningsAnalyzerService {
  async analyzeTranscript(
    companyId: string,
    quarter: string,
    transcriptText: string
  ): Promise<EarningsAnalysis> {
    try {
      const chunks = this.chunkText(transcriptText, 10000);
      
      const analyses = await Promise.all(
        chunks.map((chunk) => this.analyzeChunk(chunk))
      );

      const consolidated = this.consolidateAnalyses(analyses);

      return {
        company_id: companyId,
        quarter,
        growth_signals: consolidated.growth_signals,
        risk_signals: consolidated.risk_signals,
        management_sentiment: consolidated.management_sentiment,
        key_initiatives: consolidated.key_initiatives,
        summary: consolidated.summary,
      };
    } catch (error) {
      logger.error('Earnings analyzer error:', error);
      throw ApiError.internal('Failed to analyze earnings transcript');
    }
  }

  async summarizeEarnings(transcriptText: string): Promise<string> {
    try {
      const prompt = `Summarize this earnings call transcript in 3-4 sentences, focusing on key financial results and strategic highlights:

${transcriptText.substring(0, 5000)}...

Provide a concise executive summary.`;

      const response = await geminiService.generateContent(prompt);
      return response;
    } catch (error) {
      logger.error('Earnings summary error:', error);
      throw ApiError.internal('Failed to summarize earnings');
    }
  }

  async extractKeyMetrics(transcriptText: string): Promise<any> {
    try {
      const prompt = `Extract key financial metrics mentioned in this earnings transcript:

${transcriptText.substring(0, 5000)}...

Return JSON format:
{
  "revenue": "value and YoY change",
  "earnings": "value and YoY change",
  "guidance": "forward guidance if mentioned",
  "key_numbers": ["metric 1", "metric 2", "metric 3"]
}`;

      const response = await geminiService.generateStructuredContent(prompt);
      return response;
    } catch (error) {
      logger.error('Metrics extraction error:', error);
      return {};
    }
  }

  private async analyzeChunk(chunk: string): Promise<any> {
    const prompt = `Analyze this earnings call transcript segment:

${chunk}

Identify and return in JSON:
{
  "growth_signals": ["Positive indicators of growth"],
  "risk_signals": ["Concerns or risks mentioned"],
  "management_sentiment": "positive/neutral/negative",
  "key_initiatives": ["Strategic initiatives mentioned"],
  "summary": "Brief summary of this segment"
}`;

    return await geminiService.generateStructuredContent(prompt);
  }

  private consolidateAnalyses(analyses: any[]): any {
    const allGrowthSignals: string[] = [];
    const allRiskSignals: string[] = [];
    const allKeyInitiatives: string[] = [];
    const sentiments: string[] = [];
    const summaries: string[] = [];

    analyses.forEach((analysis) => {
      if (analysis.growth_signals) allGrowthSignals.push(...analysis.growth_signals);
      if (analysis.risk_signals) allRiskSignals.push(...analysis.risk_signals);
      if (analysis.key_initiatives) allKeyInitiatives.push(...analysis.key_initiatives);
      if (analysis.management_sentiment) sentiments.push(analysis.management_sentiment);
      if (analysis.summary) summaries.push(analysis.summary);
    });

    const uniqueGrowthSignals = [...new Set(allGrowthSignals)].slice(0, 5);
    const uniqueRiskSignals = [...new Set(allRiskSignals)].slice(0, 5);
    const uniqueKeyInitiatives = [...new Set(allKeyInitiatives)].slice(0, 5);

    const overallSentiment = this.determineOverallSentiment(sentiments);
    const overallSummary = summaries.join(' ');

    return {
      growth_signals: uniqueGrowthSignals,
      risk_signals: uniqueRiskSignals,
      management_sentiment: overallSentiment,
      key_initiatives: uniqueKeyInitiatives,
      summary: overallSummary.substring(0, 500),
    };
  }

  private determineOverallSentiment(sentiments: string[]): string {
    const counts = { positive: 0, neutral: 0, negative: 0 };

    sentiments.forEach((sentiment) => {
      const normalized = sentiment.toLowerCase();
      if (normalized.includes('positive')) counts.positive++;
      else if (normalized.includes('negative')) counts.negative++;
      else counts.neutral++;
    });

    if (counts.positive > counts.negative && counts.positive > counts.neutral) {
      return 'positive';
    } else if (counts.negative > counts.positive && counts.negative > counts.neutral) {
      return 'negative';
    }
    return 'neutral';
  }

  private chunkText(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk);

    return chunks;
  }
}

export default new EarningsAnalyzerService();
