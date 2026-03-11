import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RagService } from './rag.service';
import { SuggestionService } from './services/suggestion.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
