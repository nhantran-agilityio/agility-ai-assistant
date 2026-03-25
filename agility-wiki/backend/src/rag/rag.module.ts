import { Module } from '@nestjs/common';

import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { QueryPlannerService } from './services/query-planner.service';
import { VectorSearchService } from './services/vector-search.service';
import { AnswerGeneratorService } from './services/answer-generator.service';
import { EmbeddingService } from './services/embedding.service';
import { PrismaSearchService } from './services/prisma-search.service';
import { AuthModule } from '@/auth/auth.module';
import { AgilityWikiAgent } from './agents/agilitywiki.agent';
import { RagIngestAgent } from './agents/rag-ingest.agent';
import { PineconeService } from './services/pinecone.service';
import { ChatController } from './chat.controller';
import { PrismaSearchTool } from './tools/prisma-search.tool';
import { VectorSearchTool } from './tools/vector-search.tool';

@Module({
  imports: [AuthModule],
  controllers: [RagController, ChatController],
  providers: [
    RagService,
    QueryPlannerService,
    PrismaSearchService,
    VectorSearchService,
    AnswerGeneratorService,
    EmbeddingService,
    AgilityWikiAgent,
    RagIngestAgent,
    PineconeService,
    PrismaSearchTool,
    VectorSearchTool,
  ],
  exports: [RagService],
})
export class RagModule {}
