import type { NextApiRequest, NextApiResponse } from "next";

import { isAuthenticated } from "lib/api/core/auth";
import { withLogging } from "lib/api/core/with-logging";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { OrgMembershipUpdateRequest } from "lib/types/api/org-membership-update.request";

import { ErrorResponse, Id, IdType, OrgMembershipResponse } from "@repo/core";
import {
  sendUnsupportedMethodError,
  API,
  sendBadRequestError,
  sendNotFoundError,
  sendForbiddenError,
} from "@repo/backend";

const orgMembershipService = new OrgMembershipService();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrgMembershipResponse | ErrorResponse>,
) {
  // TODO: Figure out a better way of routing based on method!
  if (req.method === "PATCH") {
    return handlePatchOrgMembership(req, res);
  }

  return sendUnsupportedMethodError(res);
}

async function handlePatchOrgMembership(
  req: NextApiRequest,
  res: NextApiResponse<OrgMembershipResponse | ErrorResponse>,
) {
  const [authenticated, userId] = await isAuthenticated(req, res);
  if (!authenticated) {
    return;
  }

  const membershipIdRaw = API.getFirstQueryParam(req, "membershipId");
  if (!userId || !membershipIdRaw) {
    return sendBadRequestError(res);
  }

  const membershipId = Id.from<IdType.OrgMembership>(membershipIdRaw);
  const orgMembership = await orgMembershipService.get(membershipId);

  if (!orgMembership) {
    return sendNotFoundError(res);
  }

  // Check permissions
  const hasPermissions = await orgMembershipService.hasAdminPermission(
    userId,
    orgMembership.orgId,
  );
  if (!hasPermissions) {
    return sendForbiddenError(res);
  }

  const updateOrgMembershipRequest = API.get(
    OrgMembershipUpdateRequest,
    req,
    res,
  );
  if (!updateOrgMembershipRequest) {
    return;
  }

  if (!updateOrgMembershipRequest.role && !updateOrgMembershipRequest.status) {
    return sendBadRequestError(res);
  }

  const updatedMembership = await orgMembershipService.update(
    membershipId,
    updateOrgMembershipRequest,
  );

  return res.json(OrgMembershipResponse.fromEntity(updatedMembership!));
}

export default withLogging(handler);
