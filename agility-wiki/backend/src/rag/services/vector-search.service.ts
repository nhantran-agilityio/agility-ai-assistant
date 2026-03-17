import { Injectable, Logger } from '@nestjs/common';
import { Pinecone, Index } from '@pinecone-database/pinecone';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '@/database/prisma.service';
import { normalize } from '@/core/helpers/normalize.utils';
import { PineconeService } from './pinecone.service';

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  private pinecone: Pinecone;
  private index: Index;

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

      const teamCodes = [
        ...new Set(
          result.matches
            .filter((m) => m.score && m.score > 0.25)
            .map((m) => m.metadata?.tea)
            .filter((code): code is string => Boolean(code))
        ),
      ];

      if (!teamCodes.length) return [];

      const employees = await this.prisma.employee.findMany({
        where: {
          team: {
            code: {
              in: teamCodes,
            },
          },
        },
        include: { team: true },
      });

      return normalize(employees);
    } catch (error) {
      this.logger.error('Vector search failed', error);
      throw error;
    }
  }
}
