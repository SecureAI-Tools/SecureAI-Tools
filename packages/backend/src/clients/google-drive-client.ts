import { drive, drive_v3 } from "@googleapis/drive";
import { GaxiosResponse } from "gaxios";
import { OAuth2Client } from "google-auth-library";

import { ClientResponse } from "./client-response";

export class GoogleDriveClient {
  private drive: drive_v3.Drive;

  constructor(accessToken: string) {
    const oauth2Client = new OAuth2Client({
      credentials: {
        access_token: accessToken,
      }
    });

    this.drive = drive({
      version: "v3",
      auth: oauth2Client,
    });
  }

  async getDocuments({
    query,
    pageToken,
    pageSize,
    fields,
  }: {
    query?: string;
    pageToken?: string;
    pageSize?: number;
    fields?: string;
  }): Promise<ClientResponse<drive_v3.Schema$FileList>> {
    const resp = await this.drive.files.list({
      q: query,
      pageToken: pageToken,
      pageSize: pageSize,
      fields: fields,
    });

    return gaxiosResponseToClientResponse(resp);
  }

  async downloadDocument(id: string): Promise<ClientResponse<Blob>> {
    const resp = (await this.drive.files.get({
      fileId: id,
      alt: "media",
    })) as unknown as GaxiosResponse<Blob>;

    return await gaxiosResponseToClientResponse(resp);
  }
}

function gaxiosResponseToClientResponse<T>(
  response: GaxiosResponse<T>,
): ClientResponse<T> {
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    // https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
    ok: response.status >= 200 && response.status <= 299,
  };
}
