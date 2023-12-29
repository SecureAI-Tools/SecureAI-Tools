import { OrderingParams, PaginationParams } from "lib/fe/api-params";

import { Id, IdType, isEmpty, DataSource } from "@repo/core";

export const userApiPath = (userId: Id<IdType.User>): string => {
  return `/api/users/${userId}`;
};

export const chatsApiPath = ({
  orgIdOrSlug,
  userId,
  ordering = {
    orderBy: "createdAt",
    order: "asc",
  },
  pagination = {
    page: 1,
    pageSize: 10,
  },
}: {
  orgIdOrSlug?: string;
  userId?: string;
  ordering?: OrderingParams;
  pagination?: PaginationParams;
}): string => {
  return (
    `/api/chats?orderBy=${ordering.orderBy}&order=${ordering.order}&page=${pagination.page}&pageSize=${pagination.pageSize}` +
    (!isEmpty(orgIdOrSlug)
      ? `&orgIdOrSlug=${encodeURIComponent(orgIdOrSlug!)}`
      : "") +
    (!isEmpty(userId) ? `&userId=${encodeURIComponent(userId!)}` : "")
  );
};

export const chatApiPath = (chatId: Id<IdType.Chat>): string => {
  return `/api/chats/${chatId}`;
};

export const getDocumentCollectionApiPath = (
  documentCollectionId: Id<IdType.DocumentCollection>,
): string => {
  return `/api/document-collections/${documentCollectionId}`;
};

export const uploadDocumentApiPath = (
  documentCollectionId: Id<IdType.DocumentCollection>,
): string => {
  return `/api/document-collections/${documentCollectionId}/documents/upload`;
};

export const postDocumentApiPath = (
  documentCollectionId: Id<IdType.DocumentCollection>,
): string => {
  return `/api/document-collections/${documentCollectionId}/documents`;
};

export const getDocumentCollectionDocumentsApiPath = ({
  documentCollectionId,
  ordering,
  pagination,
}: {
  documentCollectionId: Id<IdType.DocumentCollection>;
  ordering: OrderingParams;
  pagination: PaginationParams;
}): string => {
  return `/api/document-collections/${documentCollectionId}/documents?orderBy=${ordering.orderBy}&order=${ordering.order}&page=${pagination.page}&pageSize=${pagination.pageSize}`;
};

export const getDocumentToCollections = ({
  documentCollectionId,
  documentIds,
}: {
  documentCollectionId: Id<IdType.DocumentCollection>;
  documentIds: Id<IdType.Document>[];
}): string => {
  return `/api/document-collections/${documentCollectionId}/documents/document-to-collection?documentIds=${documentIds.join(
    ",",
  )}`;
};

export const documentCollectionDocumentApiPath = (
  documentCollectionId: Id<IdType.DocumentCollection>,
  documentId: Id<IdType.Document>,
): string => {
  return `/api/document-collections/${documentCollectionId}/documents/${documentId}`;
};

export const documentCollectionDocumentIndexApiPath = (
  documentCollectionId: Id<IdType.DocumentCollection>,
  documentId: Id<IdType.Document>,
): string => {
  return `/api/document-collections/${documentCollectionId}/documents/${documentId}/index`;
};

export const getDocumentCollectionStatsApiPath = (
  documentCollectionId: Id<IdType.DocumentCollection>,
): string => {
  return `/api/document-collections/${documentCollectionId}/stats`;
};

export const postChatMessagesApiPath = (chatId: Id<IdType.Chat>): string => {
  return `/api/chats/${chatId}/messages`;
};

export const postChatMessagesGenerateApiPath = (
  chatId: Id<IdType.Chat>,
): string => {
  return `/api/chats/${chatId}/messages/generate`;
};

export const getChatMessagesApiPath = ({
  chatId,
  ordering = {
    orderBy: "createdAt",
    order: "asc",
  },
  pagination = {
    page: 1,
    pageSize: 10,
  },
}: {
  chatId: Id<IdType.Chat>;
  ordering?: OrderingParams;
  pagination?: PaginationParams;
}): string => {
  return `/api/chats/${chatId}/messages?orderBy=${ordering.orderBy}&order=${ordering.order}&page=${pagination.page}&pageSize=${pagination.pageSize}`;
};

export const chatTitleApiPath = (chatId: Id<IdType.Chat>): string => {
  return `/api/chats/${chatId}/title`;
};

export const getChatMessageCitationsApiPath = ({
  chatId,
  chatMessageIds,
}: {
  chatId: Id<IdType.Chat>;
  chatMessageIds: Id<IdType.ChatMessage>[];
}): string => {
  return `/api/chats/${chatId}/messages/citations?chatMessageIds=${chatMessageIds.join(
    ",",
  )}`;
};

export const organizationsIdOrSlugApiPath = (orgIdOrSlug: string): string => {
  return `/api/organizations/${orgIdOrSlug}`;
};

export const organizationsIdOrSlugChatApiPath = (
  orgIdOrSlug: string,
): string => {
  return `/api/organizations/${orgIdOrSlug}/chats`;
};

export const organizationsIdOrSlugModelsApiPath = (
  orgIdOrSlug: string,
  modelName: string,
): string => {
  return `/api/organizations/${orgIdOrSlug}/models?name=${modelName}`;
};

export const modelsPullApiPath = (orgIdOrSlug: string): string => {
  return `/api/organizations/${orgIdOrSlug}/models/pull`;
};

export const postOrganizationsIdOrSlugDocumentCollectionApiPath = (
  orgIdOrSlug: string,
): string => {
  return `/api/organizations/${orgIdOrSlug}/document-collections`;
};

export const getOrganizationsIdOrSlugDocumentCollectionApiPath = ({
  orgIdOrSlug,
  userId,
  ordering,
  pagination,
}: {
  orgIdOrSlug: string;
  userId: Id<IdType.User>;
  ordering: OrderingParams;
  pagination: PaginationParams;
}): string => {
  return `/api/organizations/${orgIdOrSlug}/document-collections?userId=${userId}&orderBy=${ordering.orderBy}&order=${ordering.order}&page=${pagination.page}&pageSize=${pagination.pageSize}`;
};

export const getOrganizationsIdOrSlugDataSourceConnectionsApiPath = ({
  orgIdOrSlug,
  userId,
  ordering,
  pagination,
  dataSources,
}: {
  orgIdOrSlug: string;
  userId: Id<IdType.User>;
  ordering: OrderingParams;
  pagination: PaginationParams;
  dataSources?: DataSource[];
}): string => {
  return (
    `/api/organizations/${orgIdOrSlug}/data-source-connections?userId=${userId}&orderBy=${ordering.orderBy}&order=${ordering.order}&page=${pagination.page}&pageSize=${pagination.pageSize}` +
    (dataSources && dataSources.length > 0
      ? dataSources.map((d) => `&dataSource=${d}`).join("")
      : "")
  );
};

export const checkDataSourceConnectionsApiPath = (
  orgIdOrSlug: string,
): string => {
  return `/api/organizations/${orgIdOrSlug}/data-source-connections/check`;
};

export const postDataSourceConnectionsApiPath = (
  orgIdOrSlug: string,
): string => {
  return `/api/organizations/${orgIdOrSlug}/data-source-connections`;
};

export const getOrgMembershipsApiPath = (
  orgId: Id<IdType.Organization>,
  // filters and ordering
  {
    nameOrEmailLike,
    userId,
    orderingParams = {
      orderBy: "createdAt",
      order: "asc",
    },
    paginationParams = {
      page: 1,
      pageSize: 10,
    },
  }: {
    nameOrEmailLike?: string;
    userId?: string;
    orderingParams?: OrderingParams;
    paginationParams?: PaginationParams;
  },
): string => {
  return (
    `/api/organizations/${orgId}/memberships?orderBy=${orderingParams.orderBy}&order=${orderingParams.order}&page=${paginationParams.page}&pageSize=${paginationParams.pageSize}` +
    (!isEmpty(nameOrEmailLike)
      ? `&nameOrEmailLike=${encodeURIComponent(nameOrEmailLike!)}`
      : "") +
    (!isEmpty(userId) ? `&userId=${encodeURIComponent(userId!)}` : "")
  );
};

export const postOrgMembershipsApiPath = (
  orgId: Id<IdType.Organization>,
): string => {
  return `/api/organizations/${orgId}/memberships`;
};

export const orgMembershipApiPath = (
  membershipId: Id<IdType.OrgMembership>,
): string => {
  return `/api/org-memberships/${membershipId}`;
};

export const userPasswordApiPath = (userId: Id<IdType.User>): string => {
  return `/api/users/${userId}/password`;
};

export const userForcePasswordResetApiPath = (
  userId: Id<IdType.User>,
): string => {
  return `${userApiPath(userId)}/password/force-reset`;
};

export const instanceConfigApiPath = (): string => {
  return "/api/instance-config";
};

export const modelProvidersApiPath = (): string => {
  return `/api/model-providers`;
};

export const getDataSourceConnetionDocumentsApiPath = ({
  connectionId,
  query,
  pagination,
}: {
  connectionId: Id<IdType.DataSourceConnection>;
  query: string;
  pagination: PaginationParams;
}): string => {
  return `/api/data-source-connections/${connectionId}/documents?query=${encodeURIComponent(
    query,
  )}&page=${pagination.page}&pageSize=${pagination.pageSize}`;
};

export const getDataSourceAuthorizeUrlApiPath = (
  dataSource: DataSource,
  redirectUri: string,
  scopes: string[],
): string => {
  return `/api/data-sources/${dataSource}/oauth/authorize-url?redirectUri=${encodeURIComponent(redirectUri)}`
    + scopes.map(s => `&scope=${encodeURIComponent(s)}`).join("");
};

export const getDataSourcesApiPath = (): string => {
  return `/api/data-sources`;
};
