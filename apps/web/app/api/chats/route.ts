import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { ChatService } from "lib/api/services/chat-service";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { ChatResponse } from "lib/types/api/chat.response";

import { API, NextResponseErrors } from "@repo/backend";
import { OrgMembershipStatus } from "@repo/core";

const chatService = new ChatService();
const orgMembershipService = new OrgMembershipService();

// Endpoint to fetch a list of chats
export async function GET(req: NextRequest) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const orgIdOrSlug = searchParams.get("orgIdOrSlug");
  const userId = searchParams.get("userId");

  if (!orgIdOrSlug || !userId) {
    return NextResponseErrors.badRequest("orgIdOrSlug and userId are required");
  }

  // Only user can access their own chat list!
  if (authUserId!.toString() !== userId) {
    return NextResponseErrors.forbidden();
  }

  const orgMemberships = await orgMembershipService.getAll({
    userId: userId!.toString(),
    org: {
      OR: [{ id: orgIdOrSlug }, { slug: orgIdOrSlug }],
    },
    status: OrgMembershipStatus.ACTIVE,
  });

  if (!orgMemberships || orgMemberships.length === 0) {
    return NextResponseErrors.notFound();
  }

  if (orgMemberships.length > 1) {
    throw new Error(
      "multiple active org memberships found for same user with same org!",
      {
        cause: orgMemberships,
      },
    );
  }

  // Get THE org membership!
  const orgMembership = orgMemberships[0];

  // Lookup chats associated with orgMembership
  const where = {
    membershipId: orgMembership!.id,
  };
  const chats = await chatService.getAll(
    where,
    API.searchParamsToOrderByInput(searchParams),
    API.PaginationParams.from(searchParams),
  );
  const count = await chatService.count(where);

  return NextResponse.json(
    chats.map((c) => ChatResponse.fromEntity(c)),
    {
      headers: API.createResponseHeaders({
        pagination: {
          totalCount: count,
        },
      }),
    },
  );
}
