import path from "path";
import sanitize from "sanitize-filename";

import { OrganizationResponse } from "lib/types/api/organization.response";
import { Id } from "lib/types/core/id";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatDocumentResponse } from "lib/types/api/chat-document.response";

export function getChatDocumentObjectKey({
  orgId,
  chatId,
  chatDocumentId,
  file,
}: {
  orgId: Id<OrganizationResponse>;
  chatId: Id<ChatResponse>;
  chatDocumentId: Id<ChatDocumentResponse>;
  file: File;
}): string {
  return path.join(
    "documents",
    "orgs",
    orgId.toString(),
    "chats",
    chatId.toString(),
    `${chatDocumentId.toString()}-${sanitize(file.name)}`,
  );
}
