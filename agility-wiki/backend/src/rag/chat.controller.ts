import { Body, Controller, Get, Post, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';

import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AgilityWikiAgent } from './agents/agilitywiki.agent';
import { SMART_QUESTION_SUGGESTIONS } from './constants/suggestions';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private wikiAgent: AgilityWikiAgent) {}

  @Post()
  @ApiOperation({ summary: 'Ask chatbot' })
  async chat(@Body() body: ChatRequestDto) {
    const result = await this.wikiAgent.chat(body.message, body.apiKey);

    return {
      text: result.text,
      status: result.status,
    };
  }

  // API streaming
  @Post('stream')
  async streamChat(@Body() body: ChatRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await this.wikiAgent.streamChat(body.message, body.apiKey, res);
  }

  @Get('suggestions')
  getSuggestions() {
    return {
      suggestions: SMART_QUESTION_SUGGESTIONS,
    };
  }
}
