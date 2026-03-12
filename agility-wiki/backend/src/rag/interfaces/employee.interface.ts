export interface EmployeeContext {
  name: string;
  email?: string | null;
  job_title?: string | null;
  phone?: string | null;
  room?: string | null;
  team_code?: string | null;
  team?: {
    name: string;
    description?: string | null;
    code?: string;
  } | null;
}
