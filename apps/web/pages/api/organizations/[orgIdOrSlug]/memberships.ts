import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@repo/database";

import { isAuthenticated } from "lib/api/core/auth";
import { withLogging } from "lib/api/core/with-logging";
import { OrgMembershipResponse } from "lib/types/api/org-membership.response";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { AddUsersRequest } from "lib/types/api/add-users.request";

import { groupBy } from "lodash";
import { ErrorResponse, isEmpty } from "@repo/core";
import { sendUnsupportedMethodError, API, sendBadRequestError, sendNotFoundError, sendForbiddenError } from "@repo/backend";

const orgMembershipService = new OrgMembershipService();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrgMembershipResponse[] | ErrorResponse>,
) {
  // TODO: Figure out a better way of routing based on method!
  if (req.method === "GET") {
    return handleGetOrganizationMembers(req, res);
  } else if (req.method === "POST") {
    return handlePostOrganizationMembers(req, res);
  }

  return sendUnsupportedMethodError(res);
}

export default withLogging(handler);

async function handleGetOrganizationMembers(
  req: NextApiRequest,
  res: NextApiResponse<OrgMembershipResponse[] | ErrorResponse>,
) {
  const [authenticated, userId] = await isAuthenticated(req, res);
  if (!authenticated) {
    return;
  }

  const orgIdOrSlug = API.getFirstQueryParam(req, "orgIdOrSlug");
  if (!userId || !orgIdOrSlug) {
    return sendBadRequestError(res);
  }

  // Check permissions
  const hasPermissions = await orgMembershipService.hasReadPermission(
    userId,
    orgIdOrSlug,
  );
  if (!hasPermissions) {
    return sendNotFoundError(res);
  }

  const nameOrEmailFilter = API.getFirstQueryParam(req, "nameOrEmailLike");
  const userIdParam = API.getFirstQueryParam(req, "userId");
  const orderBy = API.getOrderingParams(req);
  const pagination = API.getPaginationParams(req);

  const where: Prisma.OrgMembershipWhereInput = {
    user: getUserFilters(nameOrEmailFilter),
    OR: [{ orgId: orgIdOrSlug }, { org: { slug: orgIdOrSlug } }],
    userId: userIdParam,
  };

  const orgMemberships = await orgMembershipService.getAllIncludingUser(
    where,
    orderBy,
    pagination,
  );
  const count = await orgMembershipService.countAll(where);

  API.setResponseHeaders(res, {
    pagination: {
      totalCount: count,
    },
  });

  return res.json(
    orgMemberships.map((om) => OrgMembershipResponse.fromEntity(om, om.user)),
  );
}

async function handlePostOrganizationMembers(
  req: NextApiRequest,
  res: NextApiResponse<OrgMembershipResponse[] | ErrorResponse>,
) {
  const [authenticated, userId] = await isAuthenticated(req, res);
  if (!authenticated) {
    return;
  }

  const orgIdOrSlug = API.getFirstQueryParam(req, "orgIdOrSlug");
  if (!userId || !orgIdOrSlug) {
    return sendBadRequestError(res);
  }

  const addUsersRequest = API.get(AddUsersRequest, req, res);
  if (!addUsersRequest) {
    return;
  }

  if (addUsersRequest.users.length < 1) {
    return sendBadRequestError(res);
  }

  // Check permissions
  const hasPermissions = await orgMembershipService.hasAdminPermission(
    userId,
    orgIdOrSlug,
  );
  if (!hasPermissions) {
    return sendForbiddenError(res);
  }

  // Deduplicate users from the request; Take the last one
  const groupedByEmail = groupBy(addUsersRequest.users, (r) => r.email);
  const dedupedAddUserRequests = Object.entries(groupedByEmail).map(
    ([_, values]) => {
      return values[values.length - 1]!;
    },
  );

  const addUserResults = await orgMembershipService.addUsers(
    dedupedAddUserRequests,
    orgIdOrSlug,
  );

  // Limitation: In a truely mutli-tenant instance, following should happen:
  //   1. If user exists, then they should be invited to join the org when admin adds them to an org.
  //   2. If user doesn't exist, then they should be invited to join the platform, and upon joining asked to accept invite-to-join org.
  // Both of these require email/smtp support. For now, let's keep it simple and not add more dependencies.

  res.json(
    addUserResults.map((r) => OrgMembershipResponse.fromEntity(r.membership)),
  );
}

const getUserFilters = (
  nameOrEmailFilter: string | undefined,
): Prisma.UserWhereInput | undefined => {
  return isEmpty(nameOrEmailFilter)
    ? undefined
    : {
        OR: [
          {
            firstName: nameOrEmailFilter
              ? { contains: nameOrEmailFilter }
              : undefined,
          },
          {
            lastName: nameOrEmailFilter
              ? { contains: nameOrEmailFilter }
              : undefined,
          },
          {
            email: nameOrEmailFilter
              ? { contains: nameOrEmailFilter }
              : undefined,
          },
        ],
      };
};
