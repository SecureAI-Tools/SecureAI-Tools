import { OAuth2Client } from "google-auth-library";

import { DataSource } from "@repo/core";

import { DataSourceOAuthConfig } from "../types/data-source-oauth-config";
import { getLogger } from "../logger";

const logger = getLogger("oauth-service");

export interface OAuthTokens {
  accessToken?: string;
  // Unix epoch in millis when the access token expires
  accessTokenExpiresAt?: number;
  refreshToken?: string;
}

export class OAuthService {
  private oauthConfigs: Map<DataSource, DataSourceOAuthConfig>;

  constructor() {
    this.oauthConfigs = new Map();

    const configs = this.getConfigs();
    configs.forEach(c => {
      this.oauthConfigs.set(c.dataSource, c);
    });
  }

  async getAuthorizeUrl(dataSource: DataSource, redirectUri: string, scopes: string[]): Promise<string> {
    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return await this.getGoogleAuthorizeUrl(redirectUri, scopes);
      default:
        throw new Error(`unsupported data source ${dataSource}`);
    }
  }

  // Exchanges temporary authorizationCode for access token
  async getAccessToken(dataSource: DataSource, authorizationCode: string, redirectUri: string): Promise<OAuthTokens> {
    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return await this.getGoogleAccessToken(authorizationCode, redirectUri);
      default:
        throw new Error(`unsupported data source ${dataSource}`);
    }
  }

  async refreshAccessToken(dataSource: DataSource, refreshToken: string): Promise<OAuthTokens> {
    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return await this.refreshGoogleAccessToken(refreshToken);
      default:
        throw new Error(`unsupported data source ${dataSource}`);
    }
  }

  private async getGoogleAuthorizeUrl(redirectUri: string, scopes: string[]): Promise<string> {
    return this.getGoogleOAuthClient(redirectUri).generateAuthUrl({
      scope: scopes,
      access_type: "offline",
    });
  }

  private async getGoogleAccessToken(authorizationCode: string, redirectUri: string): Promise<OAuthTokens> {
    const resp = await this.getGoogleOAuthClient(redirectUri).getToken(authorizationCode);
    
    return {
      accessToken: resp.tokens.access_token ?? undefined,
      accessTokenExpiresAt: resp.tokens.expiry_date ?? undefined,
      refreshToken: resp.tokens.refresh_token ?? undefined,
    }
  }

  async refreshGoogleAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const client = this.getGoogleOAuthClient();
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

  private getGoogleOAuthClient(redirectUri?: string): OAuth2Client {
    const googleDriveOAuthConfig = this.oauthConfigs.get(DataSource.GOOGLE_DRIVE);
    if (!googleDriveOAuthConfig) {
      throw new Error("OAuth config not found for GOOGLE_DRIVE data source");
    }

    return new OAuth2Client({
      clientId: googleDriveOAuthConfig.clientId,
      clientSecret: googleDriveOAuthConfig.clientSecret,
      redirectUri: redirectUri,
    });
  }

  getConfigs(): DataSourceOAuthConfig[] {
    if (!process.env.DATA_SOURCE_OAUTH_CONFIGS) {
      return [];
    }

    try {
      return JSON.parse(
        process.env.DATA_SOURCE_OAUTH_CONFIGS,
      ) as DataSourceOAuthConfig[];
    } catch (e) {
      logger.error("could not parse DATA_SOURCE_OAUTH_CONFIGS", { error: e });
      throw new Error(
        "Invalid DATA_SOURCE_OAUTH_CONFIGS! Make sure to configure valid DATA_SOURCE_OAUTH_CONFIGS",
      );
    }
  }
}
