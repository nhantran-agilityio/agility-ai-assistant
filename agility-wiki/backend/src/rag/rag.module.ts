import { Module } from '@nestjs/common';

import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { SuggestionService } from './services/suggestion.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RagController],
  providers: [RagService, SuggestionService],
  exports: [RagService],
})
export class RagModule {}
