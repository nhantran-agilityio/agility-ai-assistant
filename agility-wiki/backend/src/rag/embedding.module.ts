import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [EmbeddingService, PrismaService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}