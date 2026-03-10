import 'dotenv/config';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_SCRIPT!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index({
  host: process.env.PINECONE_HOST!,
});

function extractNameQuery(query: string) {
  const match = query.match(/who is (.+)/i);
  return match ? match[1].trim() : null;
}

function extractTeamQuery(query: string) {
  const match = query.match(/who works in (.+) team/i);
  return match ? match[1].trim() : null;
}

async function embedQuery(query: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  return response.data[0].embedding;
}

async function smartSearch(query: string) {
  // 1️⃣ NAME QUERY
  const name = extractNameQuery(query);

  if (name) {
    const employee = await prisma.employee.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      include: { team: true },
    });

    if (employee) {
      return [employee];
    }
  }

  // 2️⃣ TEAM QUERY
  const teamName = extractTeamQuery(query);
  if (teamName) {
    const employees = await prisma.employee.findMany({
      where: {
        team: {
          name: {
            contains: teamName,
            mode: 'insensitive',
          },
        },
      },
      include: { team: true },
    });

    if (employees.length > 0) {
      return employees;
    }
  }

  // 3️⃣ FALLBACK: SEMANTIC SEARCH
  const vector = await embedQuery(query);

  const result = await index.query({
    vector,
    topK: 5,
    includeMetadata: true,
  });

  return result.matches ?? [];
}
async function generateAnswer(query: string, context: any[]) {
  if (!context.length) {
    return "I don't have enough information.";
  }

  const contextText = context
    .map((item) => {
      //If from Pinecone
      if (item.metadata) {
        return `
                Name: ${item.metadata?.name}
                Email: ${item.metadata?.email}
                Team: ${item.metadata?.team}
                Status: ${item.metadata?.status}
                Room: ${item.metadata?.work_locations}
                Job Title: ${item.metadata?.job_title}
                Phone: ${item.metadata?.phone}
                Responsibilities: ${item.metadata?.responsibilities}
                `;
      }

      //If from Prisma
      return `
            Name: ${item.name}
            Email: ${item.email}
            Team: ${item.team?.name}
            Status: ${item.status}
            Room: ${item.workLocation}
            Job Title: ${item.job_title}
            Phone: ${item.phone}
            `;
    })
    .join('\n\n');
  // LLM Integration
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        // hallucination prevention.
        content: `
            You are an internal HR assistant for Agility.
            
            You MUST answer only using the provided employee data.
            If the answer is not explicitly found in the data, respond exactly:
            "I don't have enough information."
            
            Do not guess.
            Do not assume.
            Do not fabricate information.
            `,
      },
      {
        role: 'user',
        content: `
            Question:
            ${query}
            
            Employee Data:
            ${contextText}
            `,
      },
    ],
  });

  return completion.choices[0].message.content;
}

async function main() {
  const question = process.argv[2];

  if (!question) {
    console.log('Please provide a question.');
    return;
  }

  console.log('Searching relevant employees...\n');

  const matches = await smartSearch(question);

  const answer = await generateAnswer(question, matches);

  console.log('AI Answer:\n');
  console.log(answer);
}

main().catch(console.error);
