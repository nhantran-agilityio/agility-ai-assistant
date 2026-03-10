import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Index, Pinecone } from '@pinecone-database/pinecone';
import { PrismaService } from 'src/prisma/prisma.service';
import { ERROR_MESSAGES } from 'src/core/common/constants/error';
import { RagResponse } from 'src/core/common/types/rag-response.type';

interface EmployeeContext {
  name: string;
  email?: string;
  job_title?: string;
  phone?: string;
  room?: string;
  team_code?: string;
  team?: {
    name: string;
    description?: string;
  };
}

interface QueryPlan {
  name?: string;
  job_title?: string;
  team?: string;
  responsibility?: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private getOpenAI(apiKey: string) {
    return new OpenAI({
      apiKey,
    });
  }

  private pinecone: Pinecone;
  private index: Index;

  constructor(private prisma: PrismaService) {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.index = this.pinecone.index({
      host: process.env.PINECONE_HOST!,
    });
  }

  // =========================
  // EMBEDDING
  // =========================

  private async embedQuery(query: string, apiKey: string) {
    try {
      const openai = this.getOpenAI(apiKey);
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      return res.data[0].embedding;
    } catch (error) {
      this.logger.error('Embedding failed', error);

      if (error?.status === 401) {
        throw new Error('INVALID_OPENAI_KEY');
      }

      if (error?.status === 429) {
        throw new Error('OPENAI_RATE_LIMIT');
      }

      throw new Error('AI_SERVICE_UNAVAILABLE');
    }
  }

  // =========================
  // QUERY PLANNER
  // =========================

  private async planQuery(question: string, apiKey) {
    const openai = this.getOpenAI(apiKey);
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `
              You are a query planner for an employee directory database.

              Extract useful search fields from the question.

              Possible fields:
              - name
              - job_title
              - team
              - responsibility

              Return JSON only.
            `,
          },
          {
            role: 'user',
            content: question,
          },
        ],
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      this.logger.error('LLM generation failed', error);

      // fallback empty plan
      return {};
    }
  }

  // =========================
  // PRISMA SEARCH
  // =========================

  private async prismaSearch(plan: QueryPlan) {
    const where: any = {
      OR: [],
    };

    if (plan.name) {
      where.OR.push({
        name: {
          contains: plan.name,
          mode: 'insensitive',
        },
      });
    }
    if (plan.job_title) {
      where.OR.push({
        job_title: {
          contains: plan.job_title,
          mode: 'insensitive',
        },
      });
    }

    if (plan.team) {
      where.OR.push({
        team: {
          name: {
            contains: plan.team,
            mode: 'insensitive',
          },
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

    if (!plan.name && !plan.job_title && !plan.team && !plan.responsibility) {
      return [];
    }
    try {
      const employees = await this.prisma.employee.findMany({
        where,
        include: { team: true },
        take: 5, // token limit
      });

      return this.normalize(employees);
    } catch (error) {
      this.logger.error('Prisma employee fetch failed', error);
      throw new Error('DATABASE_ERROR');
    }
  }

  // =========================
  // VECTOR SEARCH (fallback)
  // =========================

  private async vectorSearch(query: string, apiKey: string) {
    try {
      const vector = await this.embedQuery(query, apiKey);

      const result = await this.index.query({
        vector,
        topK: 8,
        includeMetadata: true,
      });
      this.logger.log(
        result.matches?.map((m) => ({
          score: m.score,
          metadata: m.metadata,
        })),
      );

      if (!result.matches?.length) return [];

      const teamCodes = [
        ...new Set(
          result.matches
            .filter((m) => m.score && m.score > 0.65)
            .map((m) => m.metadata?.team_code)
            .filter((c): c is string => typeof c === 'string'),
        ),
      ];

      if (!teamCodes.length) return [];

      try {
        const employees = await this.prisma.employee.findMany({
          where: {
            team: {
              code: {
                in: teamCodes,
              },
            },
          },
          include: { team: true },
        });
        return this.normalize(employees);
      } catch (error) {
        this.logger.error('Database search failed', error);

        throw new Error('DATABASE_ERROR');
      }
    } catch (error) {
      this.logger.error('Vector search failed', error);
      throw error;
    }
  }

  // =========================
  // NORMALIZE
  // =========================

  private normalize(employees): EmployeeContext[] {
    return employees.map((e) => ({
      name: e.name,
      email: e.email,
      job_title: e.job_title,
      phone: e.phone,
      room: e.work_location,
      team_code: e.team_code,
      team: e.team,
    }));
  }

  // =========================
  // CONTEXT COMPRESS
  // =========================

  private compressContext(context: EmployeeContext[]) {
    return context
      .map(
        (e) => `
          Name: ${e.name}
          Job Title: ${e.job_title}
          Team: ${e.team?.name}
          Email: ${e.email}
          Phone: ${e.phone}
          Room: ${e.room}
          `,
      )
      .join('\n');
  }

  // =========================
  // FINAL ANSWER
  // =========================

  private async generateAnswer(
    question: string,
    context: EmployeeContext[],
    apiKey: string,
  ) {
    const openai = this.getOpenAI(apiKey);

    if (!context.length) {
      return "I couldn't find relevant information in the company database.";
    }

    const contextText = this.compressContext(context);
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        // response structure control
        messages: [
          {
            role: 'system',
            content: `
              You are an internal company assistant.
              
              Use ONLY the employee data provided.

              Return the answer in the following format:
              - Name
              - Email
              - Phone
              - Job Title
              - Room

              If multiple employees exist, list them separately.
              `,
          },
          {
            role: 'user',
            content: `
              Question:
              ${question}

              Employee Data:
              ${contextText}
            `,
          },
        ],
      });

      return completion.choices[0].message.content;
    } catch (error) {
      this.logger.error('LLM answer generation failed', error);
      throw new Error('AI_SERVICE_UNAVAILABLE');
    }
  }

  // =========================
  // MAIN RAG PIPELINE
  // =========================

  async ask(question: string, apiKey: string): Promise<RagResponse> {
    this.logger.log(`Question: ${question}`);

    try {
      // Plan query
      const plan = await this.planQuery(question, apiKey);

      this.logger.log(`Query plan: ${JSON.stringify(plan)}`);

      // Structured search
      let context = await this.prismaSearch(plan);

      // Vector fallback
      if (!context.length) {
        this.logger.log('Fallback to vector search');

        context = await this.vectorSearch(question, apiKey);
      }

      // No data
      if (!context.length) {
        return {
          text: "I couldn't find relevant information in the company database.",
          status: 'no_data',
        };
      }

      // Generate answer
      const answer = await this.generateAnswer(question, context, apiKey);

      return {
        text: answer || '',
        status: 'ok',
      };
    } catch (error: any) {
      this.logger.error('RAG pipeline failed', error);

      if (error.message === 'OPENAI_RATE_LIMIT') {
        return {
          text: ERROR_MESSAGES.OPENAI_RATE_LIMIT,
          status: 'rate_limit',
        };
      }

      if (error.message === 'DATABASE_ERROR') {
        return {
          text: ERROR_MESSAGES.DATABASE_ERROR,
          status: 'db_error',
        };
      }

      if (error.message === 'INVALID_OPENAI_KEY') {
        return {
          text: ERROR_MESSAGES.INVALID_OPENAI_KEY,
          status: 'ai_error',
        };
      }

      return {
        text: ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE,
        status: 'ai_error',
      };
    }
  }
}
