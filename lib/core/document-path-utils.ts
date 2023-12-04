import path from "path";

export const getDocumentPath = (organizationId: string, chatId: string, chatDocumentId: string): string | null => {
  const baseDataPath = process.env.DATA_PATH;
  if (!baseDataPath) {
    console.error("DATA_PATH env is not set!");
    return null;
  }

  return path.join(baseDataPath, "documents", "orgs", organizationId, "chats", chatId.toString(), chatDocumentId);
}
