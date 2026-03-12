import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { RagService } from './rag.service';
import { SuggestionService } from './services/suggestion.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Rag')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly suggestionService: SuggestionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Ask chatbot' })
  async chat(@Body() body: ChatRequestDto) {
    const result = await this.ragService.ask(body.message, body.apiKey);

    return {
      text: result.text,
      status: result.status,
    };
  }

  // API streaming
  @Post('stream')
  @ApiOperation({ summary: 'Ask chatbot (stream response)' })
  async streamChat(
    @Body() body: ChatRequestDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    await this.ragService.stream(body.message, body.apiKey, res);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested questions' })
  @ApiResponse({
    status: 200,
    description: 'List of suggested questions',
  })
  getSuggestions() {
    return {
      suggestions: this.suggestionService.getSuggestions(),
    };
  }
}