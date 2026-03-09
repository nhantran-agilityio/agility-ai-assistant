import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PrismaService } from "src/prisma/prisma.service";

interface EmployeeContext {
  name: string;
  email?: string;
  job_title?: string;
  phone?: string;
  room?: string;
  team_code?: string;
  team?: {
    name: string;
    description?: string;
  };
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private getOpenAI(apiKey: string) {
    return new OpenAI({
      apiKey,
    });
  }

  private pinecone: Pinecone;
  private index: any;

  constructor(private prisma: PrismaService) {

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.index = this.pinecone.index({
      host: process.env.PINECONE_HOST!,
    });
  }

  // =========================
  // EMBEDDING
  // =========================

  private async embedQuery(query: string, apiKey: string) {
    const openai = this.getOpenAI(apiKey)
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    return res.data[0].embedding;
  }

  // =========================
  // QUERY PLANNER 
  // =========================

  private async planQuery(question: string, apiKey) {
    const openai = this.getOpenAI(apiKey);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
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
          role: "user",
          content: question,
        },
      ],
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  }
 
  // =========================
  // PRISMA SEARCH
  // =========================

  private async prismaSearch(plan: any) {
    const where: any = {
      OR: [],
    };

    if (plan.name) {
      where.OR.push({
        name: {
          contains: plan.name,
          mode: "insensitive",
        },
      });
    }
    if (plan.job_title) {
      where.OR.push({
        job_title: {
          contains: plan.job_title,
          mode: "insensitive",
        },
      });
    }

    if (plan.team) {
      where.OR.push({
        team: {
          name: {
            contains: plan.team,
            mode: "insensitive",
          },
        },
      });
    }

    if (plan.responsibility) {
      where.OR.push({
        team: {
          description: {
            contains: plan.responsibility,
            mode: "insensitive",
          },
        },
      });
    }

    if (where.OR.length === 0) return [];

    const employees = await this.prisma.employee.findMany({
      where,
      include: { team: true },
      take: 5,
    });

    return this.normalize(employees);
  }

  // =========================
  // VECTOR SEARCH (fallback)
  // =========================

  private async vectorSearch(query: string, apiKey: string) {
    const vector = await this.embedQuery(query, apiKey);

    const result = await this.index.query({
      vector,
      topK: 3,
      includeMetadata: true,
    });

    if (!result.matches?.length) return [];

    const teamCode = result.matches[0].metadata?.team_code;

    if (!teamCode) {
      const employees = await this.prisma.employee.findMany({
        where: {
          team: {
            description: {
              contains: query,
              mode: "insensitive"
            }
          }
        },
        include: { team: true }
      });
    
      return this.normalize(employees);
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        team: {
          code: teamCode,
        },
      },
      include: { team: true },
    });

    return this.normalize(employees);
  }

  // =========================
  // NORMALIZE
  // =========================

  private normalize(employees: any[]): EmployeeContext[] {
    return employees.map((e) => ({
      name: e.name,
      email: e.email,
      job_title: e.job_title,
      phone: e.phone,
      room: e.work_location,
      team_code: e.team_code,
      team: e.team,
    }));
  }

  // =========================
  // CONTEXT COMPRESS
  // =========================

  private compressContext(context: EmployeeContext[]) {
    return context
      .map(
        (e) => `
          Name: ${e.name}
          Job Title: ${e.job_title}
          Team: ${e.team?.name}
          Email: ${e.email}
          Phone: ${e.phone}
          Room: ${e.room}
          `
      )
      .join("\n");
  }

  // =========================
  // FINAL ANSWER
  // =========================

  private async generateAnswer(question: string, context: EmployeeContext[],  apiKey: string) {
    const openai = this.getOpenAI(apiKey);

    if (!context.length) {
      return "I couldn't find relevant information in the company database.";
    }

    const contextText = this.compressContext(context);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
            You are an internal company assistant.

            Use ONLY the employee data provided.

            Always include:
            - Name
            - Email
            - Phone
            - Job Title
            - Room
            `,
        },
        {
          role: "user",
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
  }

  // =========================
  // MAIN RAG PIPELINE
  // =========================

  async ask(question: string, apiKey: string) {
    this.logger.log(`Question: ${question}`);
  
    // 1️⃣ AI know question
    const plan = await this.planQuery(question, apiKey);
  
    this.logger.log(`Query plan: ${JSON.stringify(plan)}`);
  
    // 2️⃣ Search database
    let context = await this.prismaSearch(plan);
  
    // 3️⃣ Fallback vector search
    if (!context.length) {
      this.logger.log("Fallback to vector search");
      context = await this.vectorSearch(question, apiKey);
    }
  
    // 4️⃣ Generate answer
    return this.generateAnswer(question, context, apiKey);
  }
}