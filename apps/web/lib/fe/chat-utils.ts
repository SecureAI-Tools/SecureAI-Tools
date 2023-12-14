import { ChatCreateRequest } from "lib/types/api/chat-create.request";
import { ChatResponse } from "lib/types/api/chat.response";
import { post } from "lib/fe/api";
import {
  organizationsIdOrSlugChatApiPath,
  postChatMessagesApiPath,
} from "lib/fe/api-paths";
import { Id } from "lib/types/core/id";
import { ChatMessageCreateRequest } from "lib/types/api/chat-message-create.request";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";

export const postChat = async (
  orgIdOrSlug: string,
  req: ChatCreateRequest,
): Promise<ChatResponse> => {
  return (
    await post<ChatCreateRequest, ChatResponse>(
      organizationsIdOrSlugChatApiPath(orgIdOrSlug),
      req,
    )
  ).response;
};

export const postChatMessage = async (
  chatId: Id<ChatResponse>,
  req: ChatMessageCreateRequest,
): Promise<ChatMessageResponse> => {
  return (
    await post<ChatMessageCreateRequest, ChatMessageResponse>(
      postChatMessagesApiPath(chatId),
      req,
    )
  ).response;
};
