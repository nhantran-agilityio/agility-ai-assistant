import { Injectable } from '@nestjs/common';
import { Pinecone, Index } from '@pinecone-database/pinecone';

@Injectable()
export class PineconeService {
  private pinecone: Pinecone;
  private index: Index;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.index = this.pinecone.index({
      host: process.env.PINECONE_HOST!,
    });
  }

  getIndex(): Index {
    return this.index;
  }

  async resetIndex() {
    const index = this.getIndex();

    await index.deleteAll();
  }
}
