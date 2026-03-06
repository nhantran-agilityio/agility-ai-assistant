import { Employee, Team } from "@prisma/client";

export function employeeToEmbeddingText(
  emp: Employee & { team?: Team | null }
) {
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

This employee works at Agility.
`;
}