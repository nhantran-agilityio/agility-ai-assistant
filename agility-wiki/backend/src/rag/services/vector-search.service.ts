import { Injectable, Logger } from '@nestjs/common';
import { Pinecone, Index } from '@pinecone-database/pinecone';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { SIMILARITY_THRESHOLD } from 'src/core/common/constants/query';
import { normalize } from 'src/core/utils/normalize.utils';

@Injectable()
export class VectorSearchService {
	private readonly logger = new Logger(VectorSearchService.name);

	private pinecone: Pinecone;
	private index: Index;

	constructor(
		private prisma: PrismaService,
		private embeddingService: EmbeddingService,
	) {
		this.pinecone = new Pinecone({
			apiKey: process.env.PINECONE_API_KEY!,
		});

		this.index = this.pinecone.index({
			host: process.env.PINECONE_HOST!,
		});
	}

	async vectorSearch(query: string, apiKey: string) {
		try {
			const vector = await this.embeddingService.embedQuery(query, apiKey);

			const result = await this.index.query({
				vector,
				topK: 8,
				includeMetadata: true,
			});

			if (!result.matches?.length) return [];

			const teamCodes = [
				...new Set(
					result.matches
						.filter((m) => m.score && m.score > SIMILARITY_THRESHOLD)
						.map((m) => m.metadata?.team_code)
						.filter((c): c is string => typeof c === 'string'),
				),
			];

			if (!teamCodes.length) return [];

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

			return normalize(employees);
		} catch (error) {
			this.logger.error('Vector search failed', error);
			throw error;
		}
	}
}
