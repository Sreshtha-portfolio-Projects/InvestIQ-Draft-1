import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config';
import { ApiError } from '../../utils/apiError';
import logger from '../../utils/logger';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Gemini API error:', error);
      throw ApiError.internal('Failed to generate AI content');
    }
  }

  async generateStructuredContent(prompt: string): Promise<any> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error) {
      logger.error('Gemini structured content error:', error);
      throw ApiError.internal('Failed to generate structured AI content');
    }
  }

  async generateWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.generateContent(prompt);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Gemini retry ${i + 1}/${maxRetries}:`, error);
        await this.delay(1000 * (i + 1));
      }
    }

    throw lastError || ApiError.internal('Failed after retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new GeminiService();
