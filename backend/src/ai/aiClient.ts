import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';

/** Default: OpenRouter free router (zero-cost; see https://openrouter.ai/models?q=free) */
const DEFAULT_AI_MODEL = 'openrouter/free';

/** Small completion budget keeps free / low-credit accounts under OpenRouter’s affordable reserve */
const DEFAULT_MAX_COMPLETION_TOKENS = 1024;

/** OpenRouter API endpoint */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

function parseMaxCompletionTokens(): number {
  const raw = process.env.AI_MAX_TOKENS?.trim();
  if (!raw) return DEFAULT_MAX_COMPLETION_TOKENS;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX_COMPLETION_TOKENS;
  return Math.min(n, 32000);
}

const sanitizeApiMessage = (msg: string): string =>
  msg
    .replace(/sk-or-v1-[\w-]+/gi, '[REDACTED]')
    .replace(/Bearer\s+[\w-]+/gi, 'Bearer [REDACTED]')
    .replace(/api[_-]?key[=:]\s*[\w-]+/gi, 'api_key=[REDACTED]')
    .slice(0, 700);

type AIFailureKind = 'CONFIG' | 'MODEL' | 'UPSTREAM' | 'UNKNOWN';

const toErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string') {
    return (err as any).message as string;
  }
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.stringify(err);
    } catch {
      // fall through
    }
  }
  return String(err);
};

const classifyAIFailure = (err: unknown): { code: AIFailureKind; detail: string } => {
  const msg = toErrorMessage(err);
  const lower = msg.toLowerCase();

  // Axios error with response data
  if (axios.isAxiosError(err) && err.response?.data) {
    const respData = err.response.data;
    const errorMsg = typeof respData === 'string' ? respData : respData?.error?.message || JSON.stringify(respData);
    const errorLower = errorMsg.toLowerCase();

    // API key issues
    if (
      errorLower.includes('invalid') && errorLower.includes('key') ||
      errorLower.includes('authentication') ||
      errorLower.includes('unauthorized') ||
      errorLower.includes('invalid_api_key') ||
      err.response.status === 401
    ) {
      return { code: 'CONFIG', detail: `${err.response.status} ${errorMsg}` };
    }

    // Model not found / unsupported
    if (
      errorLower.includes('model') && (errorLower.includes('not found') || errorLower.includes('does not exist')) ||
      errorLower.includes('invalid_model') ||
      err.response.status === 404
    ) {
      return { code: 'MODEL', detail: `${err.response.status} ${errorMsg}` };
    }

    // Billing / credits (OpenRouter 402)
    if (
      err.response.status === 402 ||
      errorLower.includes('credits') ||
      (errorLower.includes('afford') && errorLower.includes('token'))
    ) {
      return { code: 'UPSTREAM', detail: `${err.response.status} ${errorMsg}` };
    }

    if (
      errorLower.includes('rate') ||
      errorLower.includes('quota') ||
      errorLower.includes('too many') ||
      errorLower.includes('limit') ||
      err.response.status === 429
    ) {
      return { code: 'UPSTREAM', detail: `${err.response.status} ${errorMsg}` };
    }

    // Other HTTP errors
    if (err.response.status >= 400) {
      return { code: 'UPSTREAM', detail: `${err.response.status} ${errorMsg}` };
    }
  }

  // Network / connection errors
  if (
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('timeout') ||
    lower.includes('socket')
  ) {
    return { code: 'UPSTREAM', detail: msg };
  }

  // Generic classification from message
  if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('authentication')) {
    return { code: 'CONFIG', detail: msg };
  }

  if (lower.includes('model') && (lower.includes('not found') || lower.includes('unsupported'))) {
    return { code: 'MODEL', detail: msg };
  }

  if (lower.includes('quota') || lower.includes('rate') || lower.includes('429')) {
    return { code: 'UPSTREAM', detail: msg };
  }

  return { code: 'UNKNOWN', detail: msg };
};

const buildUserFacingAIError = (
  classified: { code: AIFailureKind; detail: string },
  modelId: string
): string => {
  const isProd = process.env.NODE_ENV === 'production';
  const safeDetail = sanitizeApiMessage(classified.detail);

  if (classified.code === 'CONFIG') {
    return 'OpenRouter API key is invalid or missing. Update OPENROUTER_API_KEY in backend/.env and restart the backend.';
  }

  if (classified.code === 'MODEL') {
    const hint = `Set AI_MODEL to a model available on OpenRouter (default: ${DEFAULT_AI_MODEL}). Current model: ${modelId}. See https://openrouter.ai/models for available models. Restart backend after editing backend/.env.`;
    return isProd
      ? `AI model is not available. ${hint}`
      : `AI model is not available. ${hint} Details: ${safeDetail}`;
  }

  if (classified.code === 'UPSTREAM') {
    const low = safeDetail.toLowerCase();
    const billing =
      low.includes('402') ||
      low.includes('credits') ||
      low.includes('afford') ||
      (low.includes('max_tokens') && low.includes('afford'));

    if (billing) {
      const msg =
        'OpenRouter rejected the request (credits or completion budget). Defaults use the free model and 1024 output tokens; lower AI_MAX_TOKENS or add credits at openrouter.ai/settings/credits.';
      return isProd ? msg : `${msg} Details: ${safeDetail}`;
    }

    const base =
      low.includes('quota') || low.includes('rate') || low.includes('429')
        ? 'AI service rate limit or quota reached. Wait a minute and try again.'
        : 'AI service request failed. Retry shortly.';
    return isProd ? base : `${base} Details: ${safeDetail}`;
  }

  // UNKNOWN
  if (!safeDetail.trim()) {
    return 'AI service returned an error with no message. Check backend logs, OPENROUTER_API_KEY, and AI_MODEL; restart the server after changing .env.';
  }
  return `AI service error: ${safeDetail}`;
};

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class AIClient {
  private readonly modelId: string;
  private readonly maxCompletionTokens: number;
  private readonly apiKey: string | undefined;
  private readonly siteUrl: string;
  private readonly siteName: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY?.trim();
    this.modelId = (process.env.AI_MODEL || DEFAULT_AI_MODEL).trim();
    this.maxCompletionTokens = parseMaxCompletionTokens();
    this.siteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.siteName = 'InvestIQ';

    if (!this.apiKey) {
      logger.warn('OPENROUTER_API_KEY not set. AI features will be limited.');
    }

    logger.info('OpenRouter AI client initialized', {
      model: this.modelId,
      maxCompletionTokens: this.maxCompletionTokens,
      hasApiKey: !!this.apiKey,
      provider: 'OpenRouter',
    });
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env.');
    }

    const messages: OpenRouterMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const response = await axios.post<OpenRouterResponse>(
        OPENROUTER_API_URL,
        {
          model: this.modelId,
          messages,
          max_tokens: this.maxCompletionTokens,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.siteName,
          },
          timeout: 60000,
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenRouter returned empty response');
      }

      return content;
    } catch (err) {
      const classified = classifyAIFailure(err);
      logger.error('OpenRouter API error', {
        error: classified.detail,
        kind: classified.code,
        model: this.modelId,
        stack: err instanceof Error ? err.stack : undefined,
        hasApiKey: !!this.apiKey,
      });

      throw new Error(buildUserFacingAIError(classified, this.modelId));
    }
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    const jsonPrompt = `${prompt}

IMPORTANT: Return ONLY valid JSON. No markdown code blocks, no explanations, just the JSON object.`;

    const text = await this.generateContent(jsonPrompt);

    try {
      // Strip any potential markdown code blocks
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      logger.error('Failed to parse AI JSON response', { text });
      throw new Error('AI returned malformed response. Please try again.');
    }
  }
}

export const aiClient = new AIClient();
