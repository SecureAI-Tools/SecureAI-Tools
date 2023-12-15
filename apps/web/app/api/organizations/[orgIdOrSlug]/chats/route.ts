import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { ChatCreateRequest } from "lib/types/api/chat-create.request";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { PermissionService } from "lib/api/services/permission-service";

import { NextResponseErrors, Id } from "@repo/core";

const chatService = new ChatService();
const orgMembershipService = new OrgMembershipService();
const permissionService = new PermissionService();

export async function POST(
  req: NextRequest,
  { params }: { params: { orgIdOrSlug: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.orgIdOrSlug.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const hasPermissions = await orgMembershipService.isActiveMember(
    userId!,
    params.orgIdOrSlug,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  const chatCreateRequest = (await req.json()) as ChatCreateRequest;

  // Check if user has permission to read given document collection
  if (chatCreateRequest.documentCollectionId) {
    const [permission, resp] =
      await permissionService.hasReadDocumentCollectionPermission(
        userId!,
        Id.from(chatCreateRequest.documentCollectionId),
      );
    if (!permission) {
      return resp;
    }
  }

  const chatCreated = await chatService.create({
    title: chatCreateRequest.title,
    type: chatCreateRequest.type,
    orgIdOrSlug: params.orgIdOrSlug,
    creatorId: userId!,
    documentCollectionId: chatCreateRequest.documentCollectionId,
  });

  return NextResponse.json(ChatResponse.fromEntity(chatCreated));
}
