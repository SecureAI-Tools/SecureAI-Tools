import { OAuth2Client } from "google-auth-library";

import { DataSource, Id, IdType } from "@repo/core";

import { getLogger } from "../logger";
import { OrgDataSourceOAuthCredentialService } from "./org-data-source-oauth-credential-service";

const logger = getLogger("oauth-service");

export interface OAuthTokens {
  accessToken?: string;
  // Unix epoch in millis when the access token expires
  accessTokenExpiresAt?: number;
  refreshToken?: string;
}

export class OAuthService {
  private orgDataSourceOAuthCredentialService = new OrgDataSourceOAuthCredentialService();

  async getAuthorizeUrl({
    dataSource,
    redirectUri,
    scopes,
    orgId,
  }: {
    dataSource: DataSource,
    redirectUri: string,
    scopes: string[],
    orgId: Id<IdType.Organization>,
  }): Promise<string> {
    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return await this.getGoogleAuthorizeUrl(redirectUri, scopes, orgId);
      default:
        throw new Error(`unsupported data source ${dataSource}`);
    }
  }

  // Exchanges temporary authorizationCode for access token
  async getAccessToken({
    dataSource,
    authorizationCode,
    redirectUri,
    orgId,
  }: {
    dataSource: DataSource,
    authorizationCode: string,
    redirectUri: string,
    orgId: Id<IdType.Organization>,
  }): Promise<OAuthTokens> {
    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return await this.getGoogleAccessToken(authorizationCode, redirectUri, orgId);
      default:
        throw new Error(`unsupported data source ${dataSource}`);
    }
  }

  async refreshAccessToken({
    dataSource,
    refreshToken,
    orgId,
  }: {
    dataSource: DataSource,
    refreshToken: string,
    orgId: Id<IdType.Organization>,
  }): Promise<OAuthTokens> {
    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return await this.refreshGoogleAccessToken(refreshToken, orgId);
      default:
        throw new Error(`unsupported data source ${dataSource}`);
    }
  }

  private async getGoogleAuthorizeUrl(
    redirectUri: string,
    scopes: string[],
    orgId: Id<IdType.Organization>,
  ): Promise<string> {
    const client = await this.getGoogleOAuthClient(orgId, redirectUri);
    return await client.generateAuthUrl({
      scope: scopes,
      access_type: "offline",
    });
  }

  private async getGoogleAccessToken(
    authorizationCode: string,
    redirectUri: string,
    orgId: Id<IdType.Organization>,
  ): Promise<OAuthTokens> {
    const client = await this.getGoogleOAuthClient(orgId, redirectUri);
    const resp = await client.getToken(authorizationCode);
    
    return {
      accessToken: resp.tokens.access_token ?? undefined,
      accessTokenExpiresAt: resp.tokens.expiry_date ?? undefined,
      refreshToken: resp.tokens.refresh_token ?? undefined,
    }
  }

  async refreshGoogleAccessToken(
    refreshToken: string,
    orgId: Id<IdType.Organization>,
  ): Promise<OAuthTokens> {
    const client = await this.getGoogleOAuthClient(orgId);
    client.setCredentials({
      refresh_token: refreshToken, 
    });
    
    const resp = await client.refreshAccessToken();

    return {
      accessToken: resp.credentials.access_token ?? undefined,
      accessTokenExpiresAt: resp.credentials.expiry_date ?? undefined,
      refreshToken: resp.credentials.refresh_token ?? undefined,
    }
  }

  private async getGoogleOAuthClient(
    orgId: Id<IdType.Organization>,
    redirectUri?: string,
  ): Promise<OAuth2Client> {
    const oauthCredsList = await this.orgDataSourceOAuthCredentialService.getAll({
      where: {
        orgId: orgId.toString(),
        dataSource: DataSource.GOOGLE_DRIVE,
      }
    });

    if (oauthCredsList.length !== 1) {
      throw new Error(`no Google Drive oauth credentials found for orgId=${orgId}. Make sure oauth credentials are configured for it first`);
    }

    const oauthCreds = oauthCredsList[0]!;

    return new OAuth2Client({
      clientId: oauthCreds.clientId,
      clientSecret: oauthCreds.clientSecret,
      redirectUri: redirectUri,
    });
  }
}
