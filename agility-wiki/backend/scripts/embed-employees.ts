import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index({
    host: process.env.PINECONE_HOST!,
  });

// Transform employee → embedding text
function employeeToText(emp: any) {
  return `
      Employee Profile:

      Full Name: ${emp.name}
      Email: ${emp.email}
      Phone: ${emp.phone ?? "Not available"}
      Date of Birth: ${emp.date_of_birth ?? "Not available"}

      Team: ${emp.team?.name ?? "Not assigned"}
      Team Code: ${emp.team?.code ?? "N/A"}
      Team Description: ${emp.team?.description ?? "No description"}

      Work Location: ${emp.work_location ?? "Not specified"}
      Employment Status: ${emp.status ?? "Unknown"}
      This employee works as ${emp.job_title} in the ${emp.team?.name} team.
      The team is responsible for: ${emp.team?.description}.

      If someone has issues such as:
      - Laptop broken
      - Hardware failure
      - Device setup
      - System troubleshooting
      - IT support request
      They should contact this employee if they belong to this team.
      `;
}

async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

async function main() {
  console.log("Fetching employees...");

  const employees = await prisma.employee.findMany({
    include: { team: true },
  });

  console.log(`Found ${employees.length} employees`);

  for (const emp of employees) {
    const text = employeeToText(emp);

    const embedding = await createEmbedding(text);

    await index.upsert({
        records: [
          {
            id: emp.id,
            values: embedding,
            metadata: {
              name: emp.name,
              email: emp.email,
              team: emp.team?.name ?? "Not assigned",
              job_title: emp?.job_title ?? "Not assigned",
              responsibilities: emp.team?.description ?? "",
              work_locations: emp.work_location,
              phone: emp.phone,
              status: emp.status ?? 'Unknow',
            },
          },
        ],  
      });

    console.log(`✅ Embedded: ${emp.name}`);
  }

  console.log("🎉 All employees embedded successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Error embedding employees:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });