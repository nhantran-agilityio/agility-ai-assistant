import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { RagService } from '../rag/rag.service';

@Injectable()
export class ChatService {
  constructor(private readonly ragService: RagService) {}

  async chat(message: string) {
    return this.ragService.ask(message);
  }
}
