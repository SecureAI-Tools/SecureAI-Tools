import { Fetcher } from "swr";

import { parseInteger } from "lib/core/number-utils";
import { ResponseHeaders } from "lib/types/api/response-headers";
import { FetchError } from "./types/fetch-error";
import { HEADER_PAGINATION_TOTAL_COUNT } from "lib/core/constants";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ResponseWithHeaders<RES> {
  response: RES;
  headers: ResponseHeaders;
}

export function createFetcher<T>(): Fetcher<ResponseWithHeaders<T>> {
  return (input: RequestInfo, init?: RequestInit) =>
    makeRequest<null, T>(
      /* method = */ "GET",
      /* input = */ input,
      /* req = */ null,
      /* init = */ init,
    );
}

export async function get<RES>(
  input: RequestInfo,
): Promise<ResponseWithHeaders<RES>> {
  return await makeRequest<null, RES>("GET", input, null);
}

export async function post<REQ, RES>(
  input: RequestInfo,
  req: REQ,
): Promise<ResponseWithHeaders<RES>> {
  return await makeRequest<REQ, RES>("POST", input, req);
}

export async function postStreaming<REQ>(params: {
  input: RequestInfo;
  req: REQ;
  onGeneratedChunk?: (chunk: string, generatedContent: string) => void;
  onFinish?: (generatedContent: string) => void;
}): Promise<void> {
  return await makeRequestStreaming<REQ>({
    method: "POST",
    ...params,
  });
}

export async function patch<REQ, RES>(
  input: RequestInfo,
  req: REQ,
): Promise<ResponseWithHeaders<RES>> {
  return await makeRequest<REQ, RES>("PATCH", input, req);
}

// Calls DELETE endpoint
// There is underscore at the end because "delete" is a reserved keyword in TS/JS.
//
// TODO: Figure out a better name than delete_
export async function delete_<RES>(
  input: RequestInfo,
): Promise<ResponseWithHeaders<RES>> {
  return await makeRequest<null, RES>("DELETE", input, null);
}

async function makeRequest<REQ, RES>(
  method: HttpMethod,
  input: RequestInfo,
  req: REQ | null,
  init?: RequestInit,
): Promise<ResponseWithHeaders<RES>> {
  const res = await fetchHelper(method, input, req, init);

  if (!res.ok) {
    throw new FetchError(
      "An error occurred while fetching the data.",
      res.status,
      await res.json(),
    );
  }

  const parsedResponse = await res.json();
  return {
    response: parsedResponse as RES,
    headers: parseResponseHeaders(res),
  };
}

async function makeRequestStreaming<REQ>({
  method,
  input,
  req,
  init,
  onGeneratedChunk,
  onFinish,
}: {
  method: HttpMethod;
  input: RequestInfo;
  req: REQ | null;
  init?: RequestInit;
  onGeneratedChunk?: (chunk: string, generatedContent: string) => void;
  onFinish?: (generatedContent: string) => void;
}): Promise<void> {
  const res = await fetchHelper(method, input, req, init);
  if (!res || !res.body) {
    throw new Error(`received null response! ${res}, ${res.body}`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let generatedContent = "";
  while (true) {
    const { value: chunk, done } = await reader.read();
    if (done) {
      break;
    }
    generatedContent += chunk;
    onGeneratedChunk?.(chunk, generatedContent);
  }
  onFinish?.(generatedContent);
}

async function fetchHelper<REQ>(
  method: HttpMethod,
  input: RequestInfo,
  req: REQ | null,
  init?: RequestInit,
): Promise<Response> {
  return await fetch(input, {
    ...init,
    method: method,
    body: req ? JSON.stringify(req) : null,
    headers: {
      ...init?.headers,
      "Content-Type": "application/json",
    },
  });
}

const parseResponseHeaders = (res: Response): ResponseHeaders => {
  return {
    pagination: {
      totalCount: parseInteger(res.headers.get(HEADER_PAGINATION_TOTAL_COUNT)),
    },
  };
};
