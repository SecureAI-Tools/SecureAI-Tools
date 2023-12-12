import { Message } from "ai";

export class ChatTitleRequest {
  messages!: Pick<Message, "role" | "content">[];
}
