export interface ClientResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T | undefined;
}

export async function toClientResponse<T>(
  response: Response,
): Promise<ClientResponse<T>> {
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data: response.ok ? ((await response.json()) as T) : undefined,
  };
}
