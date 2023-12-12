// Represents generic progress in inference server
export interface PullModelProgressResponse {
  status: string | undefined;
  digest: string | undefined;
  total: number | undefined;
  completed: number | undefined;
  error: string | undefined;
}
