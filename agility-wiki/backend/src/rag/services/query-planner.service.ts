import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class QueryPlannerService {
  private readonly logger = new Logger(QueryPlannerService.name);

  private getOpenAI(apiKey: string) {
    return new OpenAI({ apiKey });
  }

  async planQuery(question: string, apiKey: string) {
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
      return {};
    }
  }
}
