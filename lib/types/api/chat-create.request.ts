import { ChatType } from "lib/types/core/chat-type";

export class ChatCreateRequest {
  title?: string;
  type!: ChatType;
}
