import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { compressContext } from 'src/core/utils/context-compress.util';

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

								Use ONLY the employee data provided.

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
