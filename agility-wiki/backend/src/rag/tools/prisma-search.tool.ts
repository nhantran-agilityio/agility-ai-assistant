import { Injectable } from '@nestjs/common';
import { PrismaSearchService } from '../services/prisma-search.service';

@Injectable()
export class PrismaSearchTool {
  constructor(private readonly prismaSearchService: PrismaSearchService) {}

  async search(plan) {
    return this.prismaSearchService.prismaSearch(plan);
  }
}
