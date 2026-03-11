import { Injectable, Logger } from '@nestjs/common';
import { ERROR_MESSAGES } from 'src/core/common/constants/error';
import { QueryPlannerService } from './services/query-planner.service';
import { PrismaSearchService } from './services/prisma-search.service';
import { VectorSearchService } from './services/vector-search.service';
import { AnswerGeneratorService } from './services/answer-generator.service';
import { RagResponse } from 'src/core/common/types/rag-response.type';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private planner: QueryPlannerService,
    private prismaSearch: PrismaSearchService,
    private vectorSearch: VectorSearchService,
    private answerGenerator: AnswerGeneratorService,
  ) {}

  async ask(question: string, apiKey: string): Promise<RagResponse> {
    this.logger.log(`Question: ${question}`);

    try {
      const plan = await this.planner.planQuery(question, apiKey);

      this.logger.log(`Query plan: ${JSON.stringify(plan)}`);

      let context = await this.prismaSearch.prismaSearch(plan);

      if (!context.length) {
        this.logger.log('Fallback to vector search');
        context = await this.vectorSearch.vectorSearch(question, apiKey);
      }

      if (!context.length) {
        return {
          text: ERROR_MESSAGES.NO_DATA,
          status: 'no_data',
        };
      }

      const answer = await this.answerGenerator.generateAnswer(
        question,
        context,
        apiKey,
      );

      return {
        text: answer || '',
        status: 'ok',
      };
    } catch (error: any) {
      this.logger.error('RAG pipeline failed', error);

      return {
        text: ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE,
        status: 'ai_error',
      };
    }
  }
}
