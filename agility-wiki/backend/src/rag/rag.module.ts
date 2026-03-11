import { Module } from '@nestjs/common';

import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { SuggestionService } from './services/suggestion.service';
import { AuthModule } from 'src/auth/auth.module';
import { QueryPlannerService } from './services/query-planner.service';
import { VectorSearchService } from './services/vector-search.service';
import { AnswerGeneratorService } from './services/answer-generator.service';
import { EmbeddingService } from './services/embedding.service';
import { PrismaSearchService } from './services/prisma-search.service';

@Module({
  imports: [AuthModule],
  controllers: [RagController],
  providers: [
    RagService,
    SuggestionService,
    QueryPlannerService,
    PrismaSearchService,
    VectorSearchService,
    AnswerGeneratorService,
    EmbeddingService,
  ],
  exports: [RagService],
})
export class RagModule {}
