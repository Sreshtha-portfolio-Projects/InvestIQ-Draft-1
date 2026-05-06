import { aiClient } from './aiClient';
import { PROMPTS } from './prompts';
import type {
  IntentClassificationResult,
  IntentConfidence,
  QueryIntentMode,
} from '../types';
import { logger } from '../utils/logger';

const MODES: readonly QueryIntentMode[] = [
  'SCREENER',
  'STOCK_ANALYSIS',
  'VALUATION_ANALYSIS',
  'COMPARISON',
  'UNKNOWN',
] as const;

const CONFIDENCES: readonly IntentConfidence[] = ['high', 'medium', 'low'] as const;

function normalize(raw: Partial<IntentClassificationResult>): IntentClassificationResult {
  const mode = MODES.includes(raw.mode as QueryIntentMode)
    ? (raw.mode as QueryIntentMode)
    : 'UNKNOWN';

  const confidence = CONFIDENCES.includes(raw.confidence as IntentConfidence)
    ? (raw.confidence as IntentConfidence)
    : 'medium';

  const e = raw.entities;
  const companies = Array.isArray(e?.companies)
    ? e.companies.filter((x): x is string => typeof x === 'string')
    : [];
  const metrics = Array.isArray(e?.metrics)
    ? e.metrics.filter((x): x is string => typeof x === 'string')
    : [];

  let sector: string | null = null;
  if (e && 'sector' in e && e.sector != null) {
    sector = typeof e.sector === 'string' && e.sector.trim() !== '' ? e.sector.trim() : null;
  }

  return {
    mode,
    entities: { companies, sector, metrics },
    confidence,
  };
}

export class IntentClassifierService {
  async classify(userQuery: string): Promise<IntentClassificationResult> {
    const prompt = PROMPTS.INTENT_CLASSIFICATION(userQuery.trim());
    const raw = await aiClient.generateJSON<Partial<IntentClassificationResult>>(prompt);
    const out = normalize(raw);
    logger.info('Intent classification', { mode: out.mode, confidence: out.confidence });
    return out;
  }
}

export const intentClassifierService = new IntentClassifierService();
