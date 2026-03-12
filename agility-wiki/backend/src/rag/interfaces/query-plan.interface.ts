export interface QueryPlan {
  name?: string;
  job_title?: string;
  team?: string;
  responsibility?: string;
}

export type RagStatus =
  | 'ok'
  | 'no_data'
  | 'ai_error'
  | 'db_error'
  | 'rate_limit';

export interface RagResponse {
  text: string;
  status: RagStatus;
  contact?: {
    name: string;
    email: string;
  };
}
