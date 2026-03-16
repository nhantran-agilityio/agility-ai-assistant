import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { PineconeService } from '../services/pinecone.service';
import { EmbeddingService } from '../services/embedding.service';
import { employeeToText } from '@/core/helpers/employee-to-text';

@Injectable()
export class RagIngestAgent {
  constructor(
    private prisma: PrismaService,
    private pineconeService: PineconeService,
    private embeddingService: EmbeddingService,
  ) {}

  async ingestEmployees(apiKey: string) {
    const index = this.pineconeService.getIndex();

    const employees = await this.prisma.employee.findMany({
      include: { team: true },
    });

    for (const emp of employees) {
      const text = employeeToText(emp);

      const embedding = await this.embeddingService.embedQuery(text, apiKey);

      await index.upsert({
        records: [
          {
            id: emp.id,
            values: embedding,
            metadata: {
              name: emp.name,
              email: emp.email,
              team: emp.team?.name ?? 'Not assigned',
              job_title: emp?.job_title ?? 'Not assigned',
              responsibilities: emp.team?.description ?? '',
              team_code: emp.team?.code ?? 'Not assigned',
              work_locations: emp.work_location,
              phone: emp.phone,
              status: emp.status ?? 'Unknow',
            },
          },
        ],
      });
    }
  }
}
