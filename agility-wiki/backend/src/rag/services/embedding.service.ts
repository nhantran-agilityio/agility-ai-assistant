import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  private getOpenAI(apiKey: string) {
    return new OpenAI({ apiKey });
  }

  async embedQuery(query: string, apiKey: string) {
    try {
      const openai = this.getOpenAI(apiKey);

      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      return res.data[0].embedding;
    } catch (error) {
      this.logger.error('Embedding failed', error);

      if (error?.status === 401) {
        throw new Error('INVALID_OPENAI_KEY');
      }

      if (error?.status === 429) {
        throw new Error('OPENAI_RATE_LIMIT');
      }

      throw new Error('AI_SERVICE_UNAVAILABLE');
    }
  }
}
