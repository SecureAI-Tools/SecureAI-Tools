import { OAuth2Client } from "google-auth-library";
import { Client as NotionClient } from "@notionhq/client";

import { DataSource, Id, IdType } from "@repo/core";

import { getLogger } from "../logger";
import { OrgDataSourceOAuthCredentialService } from "./org-data-source-oauth-credential-service";
import { DataSourceOAuthConfig } from "../types/data-source-oauth-config";

const logger = getLogger("oauth-service");

export interface OAuthTokens {
  accessToken?: string;
  // Unix epoch in millis when the access token expires
  accessTokenExpiresAt?: number;
  refreshToken?: string;
}

export class OAuthService {
  private orgDataSourceOAuthCredentialService = new OrgDataSourceOAuthCredentialService();

  // DataSourceOAuthConfig for system configurable data sources
  private sysOAuthConfigs: Map<DataSource, DataSourceOAuthConfig>;

  constructor() {
    this.sysOAuthConfigs = new Map();

    this.getConfigs().forEach(c => {
      this.sysOAuthConfigs.set(c.dataSource, c);
    });
  }

  async getAuthorizeUrl({
    dataSource,
    redirectUri,
    scopes,
    orgId,
    state,
  }: {
    dataSource: DataSource,
    redirectUri: string,
    scopes: string[],
    orgId: Id<IdType.Organization>,
    state: string,
  }): Promise<string> {
    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return await this.getGoogleAuthorizeUrl(redirectUri, scopes, orgId, state);
      case DataSource.NOTION:
        return await this.getNotionAuthorizeUrl(redirectUri, state);
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
      case DataSource.NOTION:
        return await this.getNotionAccessToken(authorizationCode, redirectUri);
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
    state: string,
  ): Promise<string> {
    const client = await this.getGoogleOAuthClient(orgId, redirectUri);
    return await client.generateAuthUrl({
      scope: scopes,
      access_type: "offline",
      state: state,
    });
  }

  private async getNotionAuthorizeUrl(
    redirectUri: string,
    state: string,
  ): Promise<string> {
    const notionOAuthConfig = this.sysOAuthConfigs.get(DataSource.NOTION);
    if (!notionOAuthConfig) {
      throw new Error("OAuth config not found for NOTION data source");
    }

    const url = new URL("https://api.notion.com/v1/oauth/authorize");
    url.searchParams.set("client_id", notionOAuthConfig.clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("owner", "user");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);

    return url.toString();
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

  private async getNotionAccessToken(
    authorizationCode: string,
    redirectUri: string,
  ): Promise<OAuthTokens> {
    const notionOAuthConfig = this.sysOAuthConfigs.get(DataSource.NOTION);
    if (!notionOAuthConfig) {
      throw new Error("OAuth config not found for NOTION data source");
    }

    const client = new NotionClient();
    const resp = await client.oauth.token({
      client_id: notionOAuthConfig.clientId,
      client_secret: notionOAuthConfig.clientSecret,
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: redirectUri,
    });
    
    return {
      accessToken: resp.access_token ?? undefined,
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
