import { removeTrailingSlash } from "@repo/core";

import { ClientResponse, toClientResponse } from "./client-response";

export class PaperlessNgxClient {
  private baseUrl: string;
  private authToken: string;

  constructor(url: string, token: string) {
    this.baseUrl = removeTrailingSlash(url)!;
    this.authToken = token;
  }

  async getDocuments(): Promise<ClientResponse<DocumentsResponse>> {
    const url = `${this.baseUrl}/api/documents/`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    });

    return await toClientResponse<DocumentsResponse>(resp);
  }
}

export interface DocumentsResponse {
  count: number;
  // TODO: Add more fields as needed!
}
