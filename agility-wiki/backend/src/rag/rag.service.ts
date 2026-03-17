import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { Response } from 'express';

import { QueryPlannerService } from './services/query-planner.service';
import { AnswerGeneratorService } from './services/answer-generator.service';
import { RagResponse } from './interfaces/query-plan.interface';
import { ERROR_MESSAGES } from '@/core/constants/error';
import { VectorSearchTool } from './tools/vector-search.tool';
import { PrismaSearchTool } from './tools/prisma-search.tool';
import { streamToResponse } from '@/core/helpers/stream-openai.util';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private planner: QueryPlannerService,
    private prismaSearchTool: PrismaSearchTool,
    private vectorSearchTool: VectorSearchTool,
    private answerGenerator: AnswerGeneratorService,
  ) {}

  /**
   * Retrieve context from DB or Vector search
   */
  private async retrieveContext(question: string, apiKey: string) {
    const start = Date.now();

    const plan = await this.planner.planQuery(question, apiKey);
   
    this.logger.log(`Final responsibility: ${plan.responsibility}`);
    this.logger.log(`Query plan: ${JSON.stringify(plan)}`);

    let context = await this.prismaSearchTool.search(plan);
    this.logger.log(`PrismaSearch results: ${context?.length}`);

    if (!context || context.length === 0) {
      this.logger.log(`Using VectorSearchTool`);
      context = await this.vectorSearchTool.search(question, apiKey);
    }

    this.logger.log(`Retrieval took ${Date.now() - start}ms`);

    return context;
  }

  /**
   * Format context for LLM
   */
  private formatContext(context: any[]) {
    return context
      .map(
        (c) => `
        Name: ${c.name}
        Job Title: ${c.job_title}
        Email: ${c.email}
        Phone: ${c.phone}
        Room: ${c.room}
        Team: ${c.team?.name ?? ''}
        `,
      )
      .join('\n');
  }

  /**
   * Streaming answer
   */
  async stream(message: string, apiKey: string, res: Response) {
    this.logger.log(`Streaming question: ${message}`);

    try {
      const context = await this.retrieveContext(message, apiKey);

      if (!context || context.length === 0) {
        res.write(ERROR_MESSAGES.NO_DATA);
        res.end();
        return;
      }

      const contextText = this.formatContext(context);

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `
              You are an internal company assistant.
              You MUST answer using the provided employee data.

              If the question is about responsibilities (salary, IT support, etc):
              - Find the employee whose "Team Responsibilities" best match the question

              If multiple employees match the question:
              - Return ALL relevant employees     

              DO NOT say "I cannot find" if there is any relevant information.

              Return EXACTLY in this format:

              Name: John Doe
              Email: john@example.com
              Phone: 123456
              Job Title: HR
              Room: A1

              Name: Jane Smith
              Email: jane@example.com
              Phone: 987654
              Job Title: HR
              Room: B2
             
              Context:
              ${contextText}
              `
          },
          {
            role: 'user',
            content: message,
          },
        ],
      });

      await streamToResponse(stream, res);
    } catch (error: any) {
      this.logger.error('Streaming RAG failed', error);

      res.write(ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE);
      res.end();
    }
  }

  /**
   * Non-streaming answer
   */
  async ask(question: string, apiKey: string): Promise<RagResponse> {
    this.logger.log(`Question: ${question}`);

    try {
      const context = await this.retrieveContext(question, apiKey);

      if (!context || context.length === 0) {
        return {
          text: ERROR_MESSAGES.NO_DATA,
          status: 'no_data',
        };
      }

      const answer = await this.answerGenerator.generateAnswer(
        question,
        context,
        apiKey,
      );

      return {
        text: answer || '',
        status: 'ok',
      };
    } catch (error: any) {
      this.logger.error('RAG pipeline failed', error);

      return {
        text: ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE,
        status: 'ai_error',
      };
    }
  }
}
