import { EmployeeContext } from '@/rag/interfaces/employee.interface';

export function normalize(employees): EmployeeContext[] {
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
