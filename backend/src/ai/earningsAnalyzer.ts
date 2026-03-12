import { geminiClient } from './geminiClient';
import { PROMPTS } from './prompts';
import { getSupabaseClient } from '../db/supabase';
import { EarningsAnalysis } from '../types';
import { logger } from '../utils/logger';

const CHUNK_SIZE = 8000; // characters per chunk to stay within token limits

interface FullEarningsAnalysis extends EarningsAnalysis {
  guidance: {
    revenue: string | null;
    margins: string | null;
    capex: string | null;
  };
  summary: string;
  sentiment_justification: string;
}

export class EarningsAnalyzerService {
  async analyzeTranscript(
    companyId: string,
    transcriptId?: string,
    rawTranscript?: string
  ): Promise<FullEarningsAnalysis> {
    const supabase = getSupabaseClient();

    let transcriptText = rawTranscript;
    let companyName = 'Unknown Company';
    let ticker = 'UNKNOWN';
    let quarter = 'Q1 FY24';

    if (!transcriptText && transcriptId) {
      const { data: transcript, error } = await supabase
        .from('earnings_transcripts')
        .select('*, companies(name, ticker)')
        .eq('id', transcriptId)
        .single();

      if (error || !transcript) {
        throw new Error('Transcript not found');
      }

      transcriptText = transcript.transcript_text;
      quarter = transcript.quarter;
      const company = transcript.companies as { name: string; ticker: string } | null;
      companyName = company?.name || companyName;
      ticker = company?.ticker || ticker;
    } else if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('name, ticker')
        .eq('id', companyId)
        .single();

      if (company) {
        companyName = company.name;
        ticker = company.ticker;
      }
    }

    if (!transcriptText) {
      throw new Error('No transcript text available for analysis');
    }

    // Chunk the transcript to handle long texts
    const chunks = this.chunkText(transcriptText, CHUNK_SIZE);
    logger.info('Analyzing earnings transcript', { ticker, chunks: chunks.length });

    // Analyze first meaningful chunk (usually the prepared remarks + Q&A highlights)
    const primaryChunk = chunks[0];
    const prompt = PROMPTS.EARNINGS_ANALYZER(companyName, ticker, quarter, primaryChunk);

    const analysis = await geminiClient.generateJSON<FullEarningsAnalysis>(prompt);

    // If multiple chunks, merge insights from additional chunks
    if (chunks.length > 1 && chunks[1]) {
      try {
        const additionalPrompt = PROMPTS.EARNINGS_ANALYZER(
          companyName,
          ticker,
          quarter,
          chunks[1]
        );
        const additionalAnalysis = await geminiClient.generateJSON<FullEarningsAnalysis>(additionalPrompt);

        // Merge additional signals
        analysis.growth_signals = [
          ...new Set([...analysis.growth_signals, ...additionalAnalysis.growth_signals])
        ].slice(0, 6);
        analysis.risk_signals = [
          ...new Set([...analysis.risk_signals, ...additionalAnalysis.risk_signals])
        ].slice(0, 6);
      } catch (err) {
        logger.warn('Failed to analyze additional transcript chunk', err);
      }
    }

    // Mark transcript as analyzed and cache result
    if (transcriptId) {
      try {
        await supabase
          .from('earnings_transcripts')
          .update({ analyzed: true })
          .eq('id', transcriptId);

        await supabase.from('ai_analyses').insert({
          company_id: companyId,
          analysis_type: 'earnings',
          result: analysis,
        });
      } catch {
        // Non-critical cache failure
      }
    }

    return analysis;
  }

  async getLatestAnalysis(companyId: string): Promise<FullEarningsAnalysis | null> {
    try {
      const supabase = getSupabaseClient();

      const { data } = await supabase
        .from('ai_analyses')
        .select('result')
        .eq('company_id', companyId)
        .eq('analysis_type', 'earnings')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data?.result as FullEarningsAnalysis || null;
    } catch {
      return null;
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += chunkSize) {
      // Try to break at sentence boundaries
      let end = Math.min(i + chunkSize, text.length);

      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        if (lastPeriod > i + chunkSize * 0.8) {
          end = lastPeriod + 1;
        }
      }

      chunks.push(text.slice(i, end));
    }

    return chunks;
  }
}

export const earningsAnalyzerService = new EarningsAnalyzerService();
