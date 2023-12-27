export interface ClientResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T | undefined;
}

export async function toClientResponse<T>(
  response: Response,
): Promise<ClientResponse<T>> {
  return await _toClientResponse(response, jsonDecoder<T>);
}

export async function toClientResponseBlob(
  response: Response,
): Promise<ClientResponse<Blob>> {
  return await _toClientResponse(response, blobDecoder);
}

async function _toClientResponse<T>(
  response: Response,
  decoder: (r: Response) => Promise<T>,
): Promise<ClientResponse<T>> {
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data: response.ok ? ((await decoder(response)) as T) : undefined,
  };
}

async function jsonDecoder<T>(r: Response): Promise<T> {
  return await r.json();
}

async function blobDecoder(r: Response): Promise<Blob> {
  return await r.blob();
}
