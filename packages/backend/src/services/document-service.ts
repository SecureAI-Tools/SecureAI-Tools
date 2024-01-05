import { Client as NotionClient } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { API } from "../utils/api.utils";
import { LocalObjectStorageService } from "./local-object-storage-service";
import { PaperlessNgxClient } from "../clients/paperless-ngx-client";
import { GoogleDriveClient } from "../clients/google-drive-client";
import { DataSourceConnectionService } from "./data-source-connection-service";
import { ClientResponse } from "../clients/client-response";

import {
  DataSourceConnection,
  Document,
  Prisma,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";
import { Id, IdType, DocumentIndexingStatus, DataSource, MimeType } from "@repo/core";

export interface DocumentCreateInput {
  id: Id<IdType.Document>;
  name: string;
  mimeType: MimeType;
  uri: string;
  externalId: string;
  indexingStatus: DocumentIndexingStatus;
  collectionId: Id<IdType.DocumentCollection>;
  connectionId: Id<IdType.DataSourceConnection>;
}

export class DocumentService {
  private objectStorageService = new LocalObjectStorageService();
  private dataSourceConnectionService = new DataSourceConnectionService();

  async createOrLink(i: DocumentCreateInput): Promise<Document> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createOrLinkWithTxn(tx, i);
    });
  }

  async createOrLinkWithTxn(
    prisma: TxPrismaClient,
    i: DocumentCreateInput,
  ): Promise<Document> {
    const document = await this.getOrCreateByUri(prisma, i);

    // Create corresponding DocumentToCollection
    await prisma.documentToCollection.create({
      data: {
        id: Id.generate<IdType.DocumentToCollection>().toString(),
        documentId: document.id,
        collectionId: i.collectionId.toString(),
        indexingStatus: i.indexingStatus,
      },
    });

    // Create corresponding DocumentToDataSource
    await prisma.documentToDataSource.create({
      data: {
        id: Id.generate<IdType.DocumentToDataSource>().toString(),
        documentId: document.id,
        dataSourceId: i.connectionId.toString(),
      },
    });

    return document;
  }

  // Returns a document with given uri; Creates a new if one does not exist!
  private async getOrCreateByUri(
    prisma: TxPrismaClient,
    i: DocumentCreateInput,
  ): Promise<Document> {
    const document = await prisma.document.findUnique({
      where: {
        uri: i.uri,
      },
    });

    if (document) {
      return document;
    }

    return await prisma.document.create({
      data: {
        id: i.id.toString(),
        name: i.name,
        mimeType: i.mimeType,
        uri: i.uri,
        externalId: i.externalId,
      },
    });
  }

  async get(id: Id<IdType.Document>): Promise<Document | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getWithTxn(tx, id);
    });
  }

  async getWithTxn(
    prisma: TxPrismaClient,
    id: Id<IdType.Document>,
  ): Promise<Document | null> {
    return await prisma.document.findUnique({
      where: {
        id: id.toString(),
      },
    });
  }

  async getAll({
    where,
    orderBy,
    pagination,
  }: {
    where: Prisma.DocumentWhereInput;
    orderBy?:
      | Prisma.DocumentOrderByWithRelationInput
      | Prisma.DocumentOrderByWithRelationInput[];
    pagination?: API.PaginationParams;
  }): Promise<Document[]> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getAllWithTxn({
        prisma: tx,
        where,
        orderBy,
        pagination,
      });
    });
  }

  async getAllWithTxn({
    prisma,
    where,
    orderBy,
    pagination,
  }: {
    prisma: TxPrismaClient;
    where: Prisma.DocumentWhereInput;
    orderBy?:
      | Prisma.DocumentOrderByWithRelationInput
      | Prisma.DocumentOrderByWithRelationInput[];
    pagination?: API.PaginationParams;
  }): Promise<Document[]> {
    return await prisma.document.findMany({
      where: where,
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }

  async count(where: Prisma.DocumentWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.document.count({
        where: where,
      });
    });
  }

  async delete(id: Id<IdType.Document>): Promise<Document | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.document.delete({
        where: {
          id: id.toString(),
        },
      });
    });
  }

  async updateIndexingStatus({
    documentId,
    collectionId,
    indexingStatus,
  }: {
    documentId: Id<IdType.Document>;
    collectionId: Id<IdType.DocumentCollection>;
    indexingStatus: DocumentIndexingStatus;
  }): Promise<void> {
    await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      await tx.documentToCollection.updateMany({
        where: {
          documentId: documentId.toString(),
          collectionId: collectionId.toString(),
        },
        data: {
          indexingStatus: indexingStatus,
        },
      });
    });
  }

  async read(
    document: Document,
    dataSourceConnection: DataSourceConnection,
  ): Promise<Blob> {
    const connection = await this.dataSourceConnectionService.refreshAccessTokenIfExpired(dataSourceConnection);

    if (connection.dataSource === DataSource.UPLOAD) {
      const fileBuffer = await this.objectStorageService.get(
        document.externalId,
      );
      return new Blob([fileBuffer]);
    }

    let resp: ClientResponse<Blob>;
    switch (connection.dataSource) {
      case DataSource.PAPERLESS_NGX:
        const paperlessNgxClient = new PaperlessNgxClient(
          connection.baseUrl!,
          connection.accessToken!,
        );
        resp = await paperlessNgxClient.downloadDocument(
          document.externalId,
        );
        break;
      case DataSource.GOOGLE_DRIVE:
        const googleDriveClient = new GoogleDriveClient(
          connection.accessToken!,
        );

        resp = await googleDriveClient.downloadDocument(
          document.externalId,
        )
        break;
      default:
        throw new Error(`${connection.dataSource} not supported`);
    }

    if (!resp.ok) {
      throw new Error(
        `could not download document ${document.id} from ${connection.dataSource} (${connection.baseUrl}); Received ${resp.statusText} (${resp.status})`,
      );
    }
    return resp.data!;
  }

  async exportAsText(
    document: Document,
    dataSourceConnection: DataSourceConnection,
  ): Promise<string> {
    const connection = await this.dataSourceConnectionService.refreshAccessTokenIfExpired(dataSourceConnection);

    switch (connection.dataSource) {
      case DataSource.GOOGLE_DRIVE:
        const googleDriveClient = new GoogleDriveClient(
          connection.accessToken!,
        );

        const resp = await googleDriveClient.exportAsText(
          document.externalId,
        );
        if (!resp.ok) {
          throw new Error(
            `could not export document ${document.id} from ${connection.dataSource} (${connection.baseUrl}); Received ${resp.statusText} (${resp.status})`,
          );
        }

        return resp.data!;
      case DataSource.NOTION:
        // Convert to markdown!
        const notionClient = new NotionClient({
          auth: connection.accessToken!,
        });
        
        const n2m = new NotionToMarkdown({
          notionClient: notionClient,
          config: {
            convertImagesToBase64: false,
            parseChildPages: false,
          },
        });
        const mdblocks = await n2m.pageToMarkdown(document.externalId);
        const mdString = n2m.toMarkdownString(mdblocks);

        if (!mdString["parent"]) {
          throw new Error("invalid markdown text!")
        }

        return mdString["parent"];
      default:
        throw new Error(`Data source ${connection.dataSource} can not be exported as text`);
    }
  }

  async getPreviewUrl(
    document: Document,
    dataSourceConnection: DataSourceConnection,
  ): Promise<string> {
    const connection = await this.dataSourceConnectionService.refreshAccessTokenIfExpired(dataSourceConnection);
    switch (connection.dataSource) {
      case DataSource.PAPERLESS_NGX:
        const paperlessNgxClient = new PaperlessNgxClient(
          connection.baseUrl!,
          connection.accessToken!,
        );
        return await paperlessNgxClient.getPreviewUrl(document.externalId);
      case DataSource.GOOGLE_DRIVE:
        const googleDriveClient = new GoogleDriveClient(
          connection.accessToken!,
        );

        return await googleDriveClient.getPreviewUrl(document.externalId);
      case DataSource.NOTION:
        const notionClient = new NotionClient({
          auth: connection.accessToken!,
        });

        const resp = await notionClient.pages.retrieve({
          page_id: document.externalId,
        });
        return (resp as PageObjectResponse).url;
      default:
        throw new Error(`${connection.dataSource} not supported`);
    }
  }
}
