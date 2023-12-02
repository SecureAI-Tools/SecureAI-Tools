import { Message } from "ai";

export class ChatMessageCreateRequest {
  message!: Pick<Message, "role" | "content">;
}
