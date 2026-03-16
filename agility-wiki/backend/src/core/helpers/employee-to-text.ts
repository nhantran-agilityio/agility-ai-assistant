export function employeeToText(emp) {
  return `
Employee Profile

Full Name: ${emp.name}
Email: ${emp.email}
Phone: ${emp.phone ?? 'Not available'}

Job Title: ${emp.job_title ?? 'Unknown'}
Team: ${emp.team?.name ?? 'Not assigned'}
Team Code: ${emp.team?.code ?? 'N/A'}

Work Location: ${emp.work_location ?? 'Not specified'}
Employment Status: ${emp.status ?? 'Unknown'}

This employee works as ${emp.job_title} in the ${emp.team?.name} team.

Team Responsibilities:
${emp.team?.description ?? 'No description'}

This person may be contacted for topics related to:
- ${emp.job_title}
- ${emp.team?.name}
- DevOps
- CI/CD pipelines
- deployment automation
- infrastructure
- system operations
`;
}
