import { Message } from "ai";

export class ChatMessagesRequest {
  messages!: Pick<Message, "role" | "content">[];
}
