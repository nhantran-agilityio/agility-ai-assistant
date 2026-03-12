import { EmployeeContext } from "@/rag/interfaces/employee.interface";

export function compressContext(context: EmployeeContext[]) {
  return context
    .map(
      (e) => `
        Name: ${e.name}
        Job Title: ${e.job_title}
        Team: ${e.team?.name}
        Email: ${e.email}
        Phone: ${e.phone}
        Room: ${e.room}
        `,
    )
    .join('\n');
}
