import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";

import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { OrgMembershipService } from "lib/api/services/org-membership-service";

import {
  Id,
  UserResponse,
  DocumentCollectionResponse,
  OrgMembershipStatus,
  DataSourceConnectionResponse,
} from "@repo/core";
import {
  DataSourceConnectionService,
  DocumentCollectionService,
  NextResponseErrors
} from "@repo/backend";

export class PermissionService {
  private chatService = new ChatService();
  private orgMembershipService = new OrgMembershipService();
  private documentCollectionService = new DocumentCollectionService();
  private dataSourceConnectionService = new DataSourceConnectionService();

  // TODO: Rename to hasReadChatPermission
  async hasReadPermission(
    userId: Id<UserResponse>,
    chatId: Id<ChatResponse>,
  ): Promise<[boolean, Response | undefined]> {
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
  ): Promise<[boolean, Response | undefined]> {
    // Only chat creators can write to a chat for now.
    //
    // Revisit this when allowing sharing!
    return await this.isChatCreatorWithActiveMembership(userId, chatId);
  }

  async hasWriteDocumentCollectionPermission(
    userId: Id<UserResponse>,
    documentCollectionId: Id<DocumentCollectionResponse>,
  ): Promise<[boolean, Response | undefined]> {
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
  ): Promise<[boolean, Response | undefined]> {
    // Only chat creators can read to document collection for now.
    //
    // Revisit this when allowing sharing!
    return await this.isDocumentCollectionCreatorWithActiveMembership(
      userId,
      documentCollectionId,
    );
  }

  async hasReadDocumentsFromDataSourceConnectionPermission(
    userId: Id<UserResponse>,
    dataSourceConnectionId: Id<DataSourceConnectionResponse>,
  ): Promise<[boolean, Response | undefined]> {
    // Only creator can access documents from DataSource connection
    const dataSourceConnections = await this.dataSourceConnectionService.getAll({
      where: {
        id: dataSourceConnectionId.toString(),
        membership: {
          userId: userId.toString(),
          status: OrgMembershipStatus.ACTIVE,
        }
      }
    });

    if (dataSourceConnections.length < 1) {
      // No such data source connection exists!
      return [false, NextResponseErrors.notFound()];
    }

    // Data source connection exists for given user's ACTIVE memebership.
    return [true, undefined];
  }

  private async isChatCreatorWithActiveMembership(
    userId: Id<UserResponse>,
    chatId: Id<ChatResponse>,
  ): Promise<[boolean, Response | undefined]> {
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
  ): Promise<[boolean, Response | undefined]> {
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

    return [false, NextResponseErrors.forbidden()];
  }
}
