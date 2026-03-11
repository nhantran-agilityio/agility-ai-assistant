import { Injectable, Logger } from '@nestjs/common';
import { normalize } from 'src/core/utils/normalize.utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrismaSearchService {
  private readonly logger = new Logger(PrismaSearchService.name);

  constructor(private prisma: PrismaService) {}

  async prismaSearch(plan: any) {
    const where: any = { OR: [] };

    if (plan.name) {
      where.OR.push({
        name: { contains: plan.name, mode: 'insensitive' },
      });
    }

    if (plan.job_title) {
      where.OR.push({
        job_title: { contains: plan.job_title, mode: 'insensitive' },
      });
    }

    if (plan.team) {
      where.OR.push({
        team: {
          name: { contains: plan.team, mode: 'insensitive' },
        },
      });
    }

    if (plan.responsibility) {
      where.OR.push({
        team: {
          description: {
            contains: plan.responsibility,
            mode: 'insensitive',
          },
        },
      });
    }

    if (!where.OR.length) return [];

    try {
      const employees = await this.prisma.employee.findMany({
        where,
        include: { team: true },
        take: 5,
      });

      return normalize(employees);
    } catch (error) {
      this.logger.error('Prisma employee fetch failed', error);
      throw new Error('DATABASE_ERROR');
    }
  }
}
