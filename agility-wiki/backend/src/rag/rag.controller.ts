import { Body, Controller, Post } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('chat')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post()
  async chat(@Body() body: { message: string }) {
    return this.ragService.ask(body.message);
  }

  
}