// Transform employee → embedding text
export function employeeToText(emp: any) {
  return `
      Employee Profile:

      Full Name: ${emp.name}
      Email: ${emp.email}
      Phone: ${emp.phone ?? 'Not available'}
      Date of Birth: ${emp.date_of_birth ?? 'Not available'}

      Team: ${emp.team?.name ?? 'Not assigned'}
      Team Code: ${emp.team?.code ?? 'N/A'}
      Team Description: ${emp.team?.description ?? 'No description'}

      Work Location: ${emp.work_location ?? 'Not specified'}
      Employment Status: ${emp.status ?? 'Unknown'}
      This employee works as ${emp.job_title} in the ${emp.team?.name} team.
      The team is responsible for: ${emp.team?.description}.

      If someone has issues such as:
      - Laptop broken
      - Hardware failure
      - Device setup
      - System troubleshooting
      - IT support request
      They should contact this employee if they belong to this team.

      This employee works on DevOps related tasks such as:
      - CI/CD pipelines
      - deployment automation
      - cloud infrastructure
      - cloud systems
      - server infrastructure
      - system reliability
      - monitoring and logging
      - container orchestration
      - DevOps operations

      Contact this employee for DevOps, infrastructure, deployment, or cloud related issues.
      `;
}
