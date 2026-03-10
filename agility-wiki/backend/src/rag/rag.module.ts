import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { SuggestionService } from './services/suggestion.service';

@Module({
  controllers: [RagController],
  providers: [RagService, SuggestionService],
  exports: [RagService],
})
export class RagModule {}
