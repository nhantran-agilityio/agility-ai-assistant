import { Injectable } from '@nestjs/common';
import { RagService } from '../rag.service';
import type { Response } from 'express';

@Injectable()
export class AgilityWikiAgent {
  constructor(private readonly ragService: RagService) {}

  async chat(question: string, apiKey: string) {
    return this.ragService.ask(question, apiKey);
  }

  async streamChat(question: string, apiKey: string, res: Response) {
    return this.ragService.stream(question, apiKey, res);
  }
}
