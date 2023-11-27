import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";

import { ChatResponse } from "lib/types/api/chat.response";
import { UserResponse } from "lib/types/api/user.response";
import { Id } from "lib/types/core/id";
import { ChatService } from "lib/api/services/chat-service";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { NextResponseErrors } from "lib/api/core/utils";

export class PermissionService {
  private chatService = new ChatService();
  private orgMembershipService = new OrgMembershipService();

  async hasReadPermission(
    userId: Id<UserResponse>,
    chatId: Id<ChatResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    // Only chat creators can read a chat for now.
    //
    // Revisit this when allowing sharing!
    return await this.isCreator(userId, chatId);
  }

  // Checks whether userId has write permission to given chat!
  async hasWritePermission(
    userId: Id<UserResponse>,
    chatId: Id<ChatResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    // Only chat creators can write to a chat for now.
    //
    // Revisit this when allowing sharing!
    return await this.isCreator(userId, chatId);
  }

  private async isCreator(
    userId: Id<UserResponse>,
    chatId: Id<ChatResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    const chat = await this.chatService.get(chatId);
    if (!chat) {
      return [false, NextResponseErrors.notFound()];
    }

    const orgMembership = await this.orgMembershipService.get(
      Id.from(chat.membershipId),
    );

    if (!orgMembership) {
      console.log("heh why no org membership bro?", chat.membershipId);
      throw new Error("heh why no org membership bro?");
    }

    if (orgMembership.userId !== userId.toString()) {
      return [false, NextResponse.json({ status: StatusCodes.FORBIDDEN })];
    }

    return [true, undefined];
  }
}
