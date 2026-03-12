import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from '../utils/logger';

class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not set. AI features will be limited.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey || 'placeholder');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (err) {
      logger.error('Gemini API error', err);
      throw new Error('AI service temporarily unavailable. Please try again.');
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
      logger.error('Failed to parse Gemini JSON response', { text });
      throw new Error('AI returned malformed response. Please try again.');
    }
  }
}

export const geminiClient = new GeminiClient();
