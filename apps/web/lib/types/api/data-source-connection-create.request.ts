import { DataSource } from "@repo/core";

export class DataSourceConnectionCreateRequest {
  dataSource!: DataSource;
  baseUrl!: string;

  // Fields for manual oauth flows
  accessToken?: string;
  accessTokenExpiresAt?: number;

  // Fields for automated oauth flows
  authorizationCode?: string;
  // Redirect-uri used to obtain the authorization code. Must be identical to authorization code request!
  // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
  redirectUri?: string;
}
