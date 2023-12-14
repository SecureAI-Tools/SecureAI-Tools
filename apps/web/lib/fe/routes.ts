import { ChatResponse } from "lib/types/api/chat.response";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { Id } from "lib/types/core/id";

export namespace FrontendRoutes {
  export const INDEX = "/";
  export const LOG_IN = "/log-in";
  export const LOG_IN_ERROR = LOG_IN; // Error code is provided as `?error=...` dynamically by AuthJS
  export const LOG_OUT = "/log-out";
  export const LOG_OUT_SUCCESS = `${LOG_IN}?logged-out`;
  export const APP_HOME = "/home";
  export const POST_LOG_IN = "/post-log-in";
  export const POST_LOG_IN_RESET_PASSWORD = `${POST_LOG_IN}/reset-password`;
  export const NEW = "/new";
  export const DISCORD_INVITE = "https://discord.gg/YTyPGHcYP9";
  export const USER_SETTINGS = "/settings";

  export const getChatRoute = (
    orgSlug: string,
    chatId: Id<ChatResponse>,
  ): string => `/${orgSlug}/chat/${chatId}`;

  export const getOrgHomeRoute = (orgSlug: string): string => `/${orgSlug}`;

  export const getOrgUsersRoute = (orgSlug: string): string =>
    `/${orgSlug}/users`;

  export const getOrgSettingsRoute = (orgSlug: string): string =>
    `/${orgSlug}/settings`;

  export const getOrgAddUsersRoute = (orgSlug: string): string =>
    `${getOrgUsersRoute(orgSlug)}/add`;

  export const getChatHistoryRoute = (orgSlug: string): string =>
    `${getOrgHomeRoute(orgSlug)}/chat-history`;

  export const getDocumentCollectionsRoute = (orgSlug: string): string =>
    `${getOrgHomeRoute(orgSlug)}/document-collections`;

  export const getNewDocumentCollectionsRoute = (orgSlug: string): string =>
    `${getOrgHomeRoute(orgSlug)}/document-collections/new`;

  export const getDocumentCollectionRoute = (
    orgSlug: string,
    documentCollectionId: Id<DocumentCollectionResponse>,
  ): string =>
    `${getOrgHomeRoute(orgSlug)}/document-collections/${documentCollectionId}`;

  export const getLogInWithEmailRoute = (email: string): string =>
    `${LOG_IN}&email=${encodeURIComponent(email)}`;
}
