import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function test() {
  const index = pc.index({ name: process.env.PINECONE_INDEX! });
  console.log('Pinecone connected');
}

test();