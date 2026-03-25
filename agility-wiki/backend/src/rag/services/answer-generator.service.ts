import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

import { compressContext } from '@/core/helpers/context-compress.util';

@Injectable()
export class AnswerGeneratorService {
  private readonly logger = new Logger(AnswerGeneratorService.name);

  private getOpenAI(apiKey: string) {
    return new OpenAI({ apiKey });
  }

  async generateAnswer(question: string, context: any[], apiKey: string) {
    const openai = this.getOpenAI(apiKey);

    if (!context.length) {
      return "I couldn't find relevant information in the company database.";
    }

    const contextText = compressContext(context);
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `
								You are an internal company assistant.

                You MUST answer using the provided employee data.

If the question is about responsibilities (salary, IT support, etc):
- Find the employee whose "Team Responsibilities" best match the question
- ALWAYS return the most relevant employee

DO NOT say "I cannot find" if there is any relevant information.

								Return the answer in the following format:
								- Name
								- Email
								- Phone
								- Job Title
								- Room
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
}
