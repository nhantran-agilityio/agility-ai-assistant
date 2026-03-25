import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RagIngestAgent } from './agents/rag-ingest.agent';
import { PineconeService } from './services/pinecone.service';
import { IngestRequestDto } from './dto/ingest-request.dto';

@ApiTags('Rag')
@Controller('rag')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RagController {
  constructor(
    private ingestAgent: RagIngestAgent,
    private pineconeService: PineconeService,
  ) {}

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest employees into vector DB' })
  async ingest(@Body() body: IngestRequestDto) {
    await this.ingestAgent.ingestEmployees(body.apiKey);

    return {
      status: 'ingest_completed',
    };
  }

  @Post('reset')
  async reset() {
    await this.pineconeService.resetIndex();

    return { success: true };
  }
}
