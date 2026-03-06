import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PrismaService } from "src/prisma/prisma.service";

interface EmployeeContext {
  name: string;
  email?: string;
  team_code?: string;
  team?: {
    name: string,
    code: string,
    description?: string
  };
  status?: string;
  room?: string;
  job_title?: string;
  phone?: string;
  responsibilities?: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  private openai: OpenAI;
  private pinecone: Pinecone;
  private index: any;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.index = this.pinecone.index({
      host: process.env.PINECONE_HOST!,
    });
  }

  // =========================
  // QUERY HELPERS
  // =========================

  private extractNameQuery(query: string) {
    const match =
      query.match(/tell me about (.+)/i) ||
      query.match(/who is (.+)/i);

    return match ? match[1].trim() : null;
  }

  private extractTeamQuery(query: string) {
    const match = query.match(/who works in (.+) team/i);
    return match ? match[1].trim() : null;
  }

  // =========================
  // EMBEDDING
  // =========================

  private async embedQuery(query: string) {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    return response.data[0].embedding;
  }

  // =========================
  // VECTOR SEARCH
  // =========================

  private async vectorSearch(query: string): Promise<EmployeeContext[]> {
    const vector = await this.embedQuery(query);

    const result = await this.index.query({
      vector,
      topK: 8,
      includeMetadata: true,
      includeValues: false,
      
    });

    if (!result.matches) return [];

    return result.matches.map((m) => ({
      name: m.metadata?.name,
      email: m.metadata?.email,
      team: m.metadata?.team,
      code: m.metadata?.team?.code,
      status: m.metadata?.status,
      room: m.metadata?.work_locations,
      job_title: m.metadata?.job_title,
      phone: m.metadata?.phone,
      team_code: m.metadata?.team_code,
      responsibilities: m.metadata?.responsibilities,
    }));
  }

  // =========================
  // NORMALIZE DB RESULT
  // =========================

  private normalize(employees: any[]): EmployeeContext[] {
    return employees.map((e) => ({
      name: e.name,
      email: e.email,
      team: e.team?.name,
      status: e.status,
      room: e.work_location,
      job_title: e.job_title,
      phone: e.phone,
      team_code: e.team_code,
      responsibilities: e.team?.description,
      code: e.team?.code,
    }));
  }

  // =========================
  // SMART SEARCH
  // =========================

  private async smartSearch(query: string): Promise<EmployeeContext[]> {
    this.logger.log(`Query: ${query}`);

    // 1️⃣ NAME SEARCH
    const name = this.extractNameQuery(query);

    if (name) {
      this.logger.log(`Searching name: ${name}`);

      const employees = await this.prisma.employee.findMany({
        where: {
          name: {
            contains: name,
            mode: "insensitive",
          },
        },
        include: { team: true },
      });

      if (employees.length) {
        return this.normalize(employees);
      }

      // 2️⃣ JOB TITLE SEARCH
      const jobEmployees = await this.prisma.employee.findMany({
        where: {
          job_title: {
            contains: name,
            mode: "insensitive",
          },
        },
        include: { team: true },
      });

      if (jobEmployees.length) {
        return this.normalize(jobEmployees);
      }
    }

    // 3️⃣ TEAM SEARCH
    const teamName = this.extractTeamQuery(query);

    if (teamName) {
      this.logger.log(`Searching team: ${teamName}`);

      const employees = await this.prisma.employee.findMany({
        where: {
          team: {
            name: {
              contains: teamName,
              mode: "insensitive",
            },
          },
        },
        include: { team: true },
      });

      if (employees.length) {
        return this.normalize(employees);
      }
    }

    // 4️⃣ VECTOR SEARCH (fallback)
    this.logger.log(`Fallback vector search`);

    return this.vectorSearch(query);
  }

  // =========================
  // CONTEXT COMPRESSION
  // =========================

  private compressContext(context: EmployeeContext[]) {
    return context
      .slice(0, 4)
      .map(
        (e) => `
Employee Profile
Name: ${e.name}
Email: ${e.email}
Team: ${e.team} ${e.team}
Job Title: ${e.job_title}
Phone: ${e.phone}
Room: ${e.room}
Code:  ${e?.team_code}
Responsibilities: ${e.responsibilities}
`
      )
      .join("\n");
  }

  // =========================
  // LLM GENERATION
  // =========================

  private async generateAnswer(
    query: string,
    context: EmployeeContext[]
  ) {
    if (!context.length) {
      return "I don't have enough information.";
    }

    const contextText = this.compressContext(context);

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are an internal company assistant.

Your job is to help employees find the right person to contact.

Rules:
- Always answer in a friendly and helpful way.
- When the user asks "who", provide employee names if available.
- Include job title and team if possible.
- If multiple people match, list them.
- Never answer with only a short sentence.
`,
        },
        {
          role: "user",
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

  // =========================
  // MAIN RAG PIPELINE
  // =========================

  async ask(question: string) {
    this.logger.log(`Question: ${question}`);

    const context = await this.smartSearch(question);

    this.logger.log(`Context found: ${context.length}`);

    const answer = await this.generateAnswer(question, context);

    return answer;
  }
}