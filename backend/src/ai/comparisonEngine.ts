import { aiClient } from './aiClient';
import { PROMPTS } from './prompts';
import { fetchCompanyResearchBundle, extractTickersFromText } from './companyContext';
import type { ComparisonEngineResult, IntentClassificationResult } from '../types';
import { logger } from '../utils/logger';

async function resolvePair(
  question: string,
  intent: IntentClassificationResult
): Promise<[string, string] | null> {
  const entityLine = intent.entities.companies
    .map((c) => c.trim())
    .filter(Boolean)
    .join(' vs ');
  const combined = entityLine ? `${entityLine}\n${question}` : question;

  const fromCombined = await extractTickersFromText(combined, 5);
  if (fromCombined.length >= 2) {
    return [fromCombined[0], fromCombined[1]];
  }

  const fromText = await extractTickersFromText(question, 5);
  if (fromText.length >= 2) {
    return [fromText[0], fromText[1]];
  }

  const normalizedEntities = intent.entities.companies.map((c) => c.trim()).filter(Boolean);
  const synthetic = [...normalizedEntities, question].join(' ');
  const fromEntities = await extractTickersFromText(synthetic, 5);
  if (fromEntities.length >= 2) {
    return [fromEntities[0], fromEntities[1]];
  }

  return null;
}

export class ComparisonEngineService {
  async compare(request: { question: string; intent: IntentClassificationResult }): Promise<ComparisonEngineResult> {
    const { question, intent } = request;
    const pair = await resolvePair(question, intent);

    if (!pair) {
      return {
        winner: 'NEUTRAL',
        valuation_comparison:
          'Could not detect two distinct tickers or recognized company names. Name two stocks (e.g. TCS vs INFY) or use symbols present in our coverage list.',
        growth_comparison: '—',
        quality_comparison: '—',
        recommendation: {},
        summary:
          'Provide a comparison with two company names or NSE-style tickers (e.g. TCS and INFY, or Reliance vs ICICI Bank).',
      };
    }

    const [t1, t2] = pair;
    const [b1, b2] = await Promise.all([fetchCompanyResearchBundle(t1), fetchCompanyResearchBundle(t2)]);

    if (!b1 || !b2) {
      logger.warn('ComparisonEngine missing bundle', { t1, t2, ok1: !!b1, ok2: !!b2 });
      return {
        winner: 'NEUTRAL',
        valuation_comparison:
          'One or both tickers could not be loaded (data unavailable). Verify symbols match our database and market data.',
        growth_comparison: '—',
        quality_comparison: '—',
        recommendation: { [t1]: 'N/A', [t2]: 'N/A' },
        summary: 'Comparison requires both companies to resolve in our universe.',
      };
    }

    const prompt = PROMPTS.COMPARE_STOCKS(
      { ticker: b1.ticker, name: b1.companyName, financials: b1.financials },
      { ticker: b2.ticker, name: b2.companyName, financials: b2.financials }
    );

    return aiClient.generateJSON<ComparisonEngineResult>(prompt);
  }
}

export const comparisonEngineService = new ComparisonEngineService();
