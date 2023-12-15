import type { NextApiRequest, NextApiResponse } from "next";

import { isAuthenticated } from "lib/api/core/auth";
import { withLogging } from "lib/api/core/with-logging";
import { OrganizationService } from "lib/api/services/organization-service";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { OrganizationUpdateRequest } from "lib/types/api/organization-update.request";

import { ErrorResponse } from "@repo/core/src/types/error.response";
import { OrganizationResponse } from "@repo/core/src/types/organization.response";
import { API } from "@repo/core/src/utils/api.utils";
import { sendUnsupportedMethodError, sendBadRequestError, sendNotFoundError, sendForbiddenError } from "@repo/core/src/utils/utils";

const organizationService = new OrganizationService();
const orgMembershipService = new OrgMembershipService();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrganizationResponse | ErrorResponse>,
) {
  // TODO: Figure out a better way of routing based on method!
  if (req.method === "GET") {
    return handleGetOrganization(req, res);
  } else if (req.method === "PATCH") {
    return handlePatchOrganization(req, res);
  }

  return sendUnsupportedMethodError(res);
}

async function handleGetOrganization(
  req: NextApiRequest,
  res: NextApiResponse<OrganizationResponse | ErrorResponse>,
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

  const organization = await organizationService.get(orgIdOrSlug);
  if (!organization) {
    return sendNotFoundError(res);
  }

  return res.json(OrganizationResponse.fromEntity(organization));
}

async function handlePatchOrganization(
  req: NextApiRequest,
  res: NextApiResponse<OrganizationResponse | ErrorResponse>,
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
  const hasPermissions = await orgMembershipService.hasAdminPermission(
    userId,
    orgIdOrSlug,
  );
  if (!hasPermissions) {
    return sendForbiddenError(res);
  }

  const updateOrgRequest = API.get(OrganizationUpdateRequest, req, res);
  if (!updateOrgRequest) {
    return;
  }

  if (
    !updateOrgRequest.name &&
    !updateOrgRequest.slug &&
    !updateOrgRequest.defaultModel &&
    !updateOrgRequest.defaultModelType
  ) {
    return sendBadRequestError(res);
  }

  const updatedOrg = await organizationService.update(
    orgIdOrSlug,
    updateOrgRequest,
  );

  return res.json(OrganizationResponse.fromEntity(updatedOrg));
}

export default withLogging(handler);
