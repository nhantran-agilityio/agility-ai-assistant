import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '@/database/prisma.service';
import { normalize } from '@/core/helpers/normalize.utils';
import { PineconeService } from './pinecone.service';

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
    private pineconeService: PineconeService,
  ) {}

  async vectorSearch(query: string, apiKey: string) {
    try {
      const vector = await this.embeddingService.embedQuery(query, apiKey);
      const index = this.pineconeService.getIndex();

      const result = await index.query({
        vector,
        topK: 8,
        includeMetadata: true,
      });

      console.log(
        'result.matches',
        result.matches.map((m) => ({
          score: m.score,
          name: m.metadata?.name,
        })),
      );

      if (!result.matches?.length) return [];
      const emails = result.matches
        .filter(m => m.score && m.score > 0.25)
        .slice(0, 1)
        .map(m => m.metadata?.email)
        .filter((email): email is string => !!email);
      
        const employees = await this.prisma.employee.findMany({
        where: {
          email: { in: emails }
        },
        include: { team: true }
      });

      return normalize(employees);
    } catch (error) {
      this.logger.error('Vector search failed', error);
      throw error;
    }
  }
}
