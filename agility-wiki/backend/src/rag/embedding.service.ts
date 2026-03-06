import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI;
  private index;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.index = pinecone.index({
      host: process.env.PINECONE_HOST!,
    });
  }

  // 🔹 Transform employee → embedding text
  private employeeToText(emp: any) {
    return `
  Employee Information
  
  Name: ${emp.name}
  Job Title: ${emp.job_title}
  Email: ${emp.email}
  Phone: ${emp.phone ?? 'Not available'}
  
  Team Information
  Team Name: ${emp.team?.name}
  Team Code: ${emp.team?.code}
  Team Responsibility: ${emp.team?.description}
  
  Work Location: ${emp.work_location}
  Status: ${emp.status}
  
  ${emp.name} works in the ${emp.team?.name} team (${emp.team?.code}).
  
  People who need help related to:
  - salary
  - payroll
  - benefits
  - HR questions
  should contact employees in this team.
  
  People who need help related to:
  - laptop issues
  - device problems
  - IT troubleshooting
  should contact employees in this team.
  `;
  }

  // 🔹 Create embedding
  private async createEmbedding(text: string) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  // 🔹 Embed 1 employee
  async embedEmployee(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { team: true },
    });

    if (!emp) {
      throw new Error('Employee not found');
    }

    const text = this.employeeToText(emp);
    const embedding = await this.createEmbedding(text);

    await this.index.upsert({
      records: [
        {
          id: emp.id,
          values: embedding,
          metadata: {
            name: emp.name,
            email: emp.email,
            team: emp.team?.name ?? 'Not assigned',
            job_title: emp.job_title ?? 'Not assigned',
            responsibilities: emp.team?.description ?? '',
            work_locations: emp.work_location ?? '',
            phone: emp.phone ?? '',
            status: emp.status ?? 'Unknown',
            team_code: emp.team?.code ?? '',
          },
        },
      ],
    });

    this.logger.log(`✅ Embedded employee: ${emp.name}`);
  }

  // 🔹 Embed all employees
  async embedAllEmployees() {
    this.logger.log('Fetching employees from database...');

    const employees = await this.prisma.employee.findMany({
      include: { team: true },
    });

    this.logger.log(`Found ${employees.length} employees`);

    for (const emp of employees) {
      try {
        const text = this.employeeToText(emp);
        const embedding = await this.createEmbedding(text);

        await this.index.upsert({
          records: [
            {
              id: emp.id,
              values: embedding,
              metadata: {
                name: emp.name,
                email: emp.email,
                team: emp.team?.name ?? 'Not assigned',
                job_title: emp.job_title ?? 'Not assigned',
                responsibilities: emp.team?.description ?? '',
                work_locations: emp.work_location ?? '',
                phone: emp.phone ?? '',
                status: emp.status ?? 'Unknown',
              },
            },
          ],
        });

        this.logger.log(`✅ Embedded: ${emp.name}`);
      } catch (error) {
        this.logger.error(
          `❌ Failed embedding employee ${emp.name}`,
          error,
        );
      }
    }

    this.logger.log('🎉 All employees embedded successfully!');
  }

  // 🔹 Delete vector (optional)
  async deleteEmbedding(employeeId: string) {
    await this.index.deleteOne(employeeId);
    this.logger.log(`🗑 Deleted embedding for employee ${employeeId}`);
  }
}