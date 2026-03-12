import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { Response } from 'express';
import { ERROR_MESSAGES } from 'src/core/common/constants/error';
import { QueryPlannerService } from './services/query-planner.service';
import { PrismaSearchService } from './services/prisma-search.service';
import { VectorSearchService } from './services/vector-search.service';
import { AnswerGeneratorService } from './services/answer-generator.service';
import { RagResponse } from 'src/core/common/types/rag-response.type';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private planner: QueryPlannerService,
    private prismaSearch: PrismaSearchService,
    private vectorSearch: VectorSearchService,
    private answerGenerator: AnswerGeneratorService,
  ) {}

  async stream(message: string, apiKey: string, res: Response) {
    this.logger.log(`Streaming question: ${message}`);

    try {
      // 1️⃣ Query planning
      const plan = await this.planner.planQuery(message, apiKey);

      this.logger.log(`Query plan: ${JSON.stringify(plan)}`);

      // 2️⃣ Try Prisma search first
      let context: any = await this.prismaSearch.prismaSearch(plan);

      // 3️⃣ Fallback to vector search
      if (!context.length) {
        this.logger.log('Fallback to vector search');
        context = await this.vectorSearch.vectorSearch(message, apiKey);
      }

      if (!context.length) {
        res.write(ERROR_MESSAGES.NO_DATA);
        res.end();
        return;
      }

      // 4️⃣ Convert context → text
      const contextText = Array.isArray(context)
        ? context
            .map((c) => {
              if (typeof c === 'string') return c;
              if (c.text) return c.text;
              return JSON.stringify(c);
            })
            .join('\n\n')
        : String(context);

      const openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY!,
      });

      // 5️⃣ Stream response
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `
            You are an internal company assistant.

            Answer ONLY using the context below.
            If the answer is not in the context, say you don't have that information.

            Context:
            ${contextText}
            `,
          },
          {
            role: 'user',
            content: message,
          },
        ],
      });

      // 6️⃣ Send tokens to FE
      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content;

        if (token) {
          res.write(token);
        }
      }

      res.end();
    } catch (error: any) {
      this.logger.error('Streaming RAG failed', error);

      res.write(ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE);
      res.end();
    }
  }

  async ask(question: string, apiKey: string): Promise<RagResponse> {
    this.logger.log(`Question: ${question}`);

    try {
      const plan = await this.planner.planQuery(question, apiKey);

      this.logger.log(`Query plan: ${JSON.stringify(plan)}`);

      let context = await this.prismaSearch.prismaSearch(plan);

      if (!context.length) {
        this.logger.log('Fallback to vector search');
        context = await this.vectorSearch.vectorSearch(question, apiKey);
      }

      if (!context.length) {
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