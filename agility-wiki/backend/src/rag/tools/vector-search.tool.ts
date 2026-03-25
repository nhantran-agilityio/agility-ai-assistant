import { Injectable } from '@nestjs/common';
import { VectorSearchService } from '../services/vector-search.service';

@Injectable()
export class VectorSearchTool {
  constructor(private readonly vectorSearchService: VectorSearchService) {}

  async search(query: string, apiKey: string) {
    return this.vectorSearchService.vectorSearch(query, apiKey);
  }
}
