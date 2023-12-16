import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { ModelsResponse } from "lib/types/api/models.response";

import { NextResponseErrors } from "@repo/backend";
import { isEmpty } from "@repo/core";

const orgMembershipService = new OrgMembershipService();

export async function GET(
  req: NextRequest,
  { params }: { params: { orgIdOrSlug: string } },
) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permissions
  const hasPermissions = await orgMembershipService.hasReadPermission(
    authUserId!,
    params.orgIdOrSlug,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (isEmpty(name)) {
    return NextResponseErrors.badRequest("name must be specified");
  }

  const ollamaResponse = await fetch(
    `${
      process.env.INFERENCE_SERVER +
      (process.env.INFERENCE_SERVER?.endsWith("/") ? "" : "/")
    }api/tags`,
    {
      method: "GET",
    },
  );

  const parsedResponse = (await ollamaResponse.json()) as ModelsResponse;
  const model = parsedResponse.models.find((m) => m.name === name);
  const response: ModelsResponse = {
    models: model ? [{ ...model }] : [],
  };
  return NextResponse.json(response);
}
