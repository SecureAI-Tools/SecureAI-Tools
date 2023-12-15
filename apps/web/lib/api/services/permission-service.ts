import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";

import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { OrgMembershipStatus } from "lib/types/core/org-membership-status";

import { DocumentCollectionService } from "@repo/core/src/services/document-collection-service";
import { DocumentCollectionResponse } from "@repo/core/src/types/document-collection.response";
import { Id } from "@repo/core/src/types/id";
import { UserResponse } from "@repo/core/src/types/user.response";
import { NextResponseErrors } from "@repo/core/src/utils/utils";

export class PermissionService {
  private chatService = new ChatService();
  private orgMembershipService = new OrgMembershipService();
  private documentCollectionService = new DocumentCollectionService();

  // TODO: Rename to hasReadChatPermission
  async hasReadPermission(
    userId: Id<UserResponse>,
    chatId: Id<ChatResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    // Only chat creators can read a chat for now.
    //
    // Revisit this when allowing sharing!
    return await this.isChatCreatorWithActiveMembership(userId, chatId);
  }

  // Checks whether userId has write permission to given chat!
  // TODO: Rename to hasWriteChatPermission
  async hasWritePermission(
    userId: Id<UserResponse>,
    chatId: Id<ChatResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    // Only chat creators can write to a chat for now.
    //
    // Revisit this when allowing sharing!
    return await this.isChatCreatorWithActiveMembership(userId, chatId);
  }

  async hasWriteDocumentCollectionPermission(
    userId: Id<UserResponse>,
    documentCollectionId: Id<DocumentCollectionResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    // Only chat creators can write to document collection for now.
    //
    // Revisit this when allowing sharing!
    return await this.isDocumentCollectionCreatorWithActiveMembership(
      userId,
      documentCollectionId,
    );
  }

  async hasReadDocumentCollectionPermission(
    userId: Id<UserResponse>,
    documentCollectionId: Id<DocumentCollectionResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    // Only chat creators can read to document collection for now.
    //
    // Revisit this when allowing sharing!
    return await this.isDocumentCollectionCreatorWithActiveMembership(
      userId,
      documentCollectionId,
    );
  }

  private async isChatCreatorWithActiveMembership(
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

    if (
      orgMembership.userId === userId.toString() &&
      orgMembership.status === OrgMembershipStatus.ACTIVE
    ) {
      return [true, undefined];
    }
    return [false, NextResponse.json({ status: StatusCodes.FORBIDDEN })];
  }

  private async isDocumentCollectionCreatorWithActiveMembership(
    userId: Id<UserResponse>,
    documentCollectionId: Id<DocumentCollectionResponse>,
  ): Promise<[boolean, NextResponse | undefined]> {
    const collection =
      await this.documentCollectionService.get(documentCollectionId);

    if (!collection) {
      return [false, NextResponseErrors.notFound()];
    }

    const orgMemberships = await this.orgMembershipService.getAll({
      userId: userId.toString(),
      orgId: collection.organizationId,
      status: OrgMembershipStatus.ACTIVE,
    });

    if (orgMemberships.length > 0) {
      // Active member of collection's org!
      return [collection.ownerId === userId.toString(), undefined];
    }

    return [false, NextResponse.json({ status: StatusCodes.FORBIDDEN })];
  }
}
