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
