import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { NextResponseErrors } from "lib/api/core/utils";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { DocumentCollectionService } from "lib/api/services/document-collection-service";
import { OrganizationService } from "lib/api/services/organization-service";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { DocumentCollectionCreateRequest } from "lib/types/api/document-collection-create.request";
import { ModelType, toModelType } from "lib/types/core/model-type";

const orgMembershipService = new OrgMembershipService();
const orgService = new OrganizationService();
const documentCollectionService = new DocumentCollectionService();

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

  const org = await orgService.get(params.orgIdOrSlug);
  if (!org) {
    return NextResponseErrors.notFound();
  }

  const hasPermissions = await orgMembershipService.isActiveMember(
    userId!,
    params.orgIdOrSlug,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  const documentCollectionCreateRequest =
    (await req.json()) as DocumentCollectionCreateRequest;

  const documentCollection = await documentCollectionService.create({
    name: documentCollectionCreateRequest.name,
    ownerId: userId!,
    orgId: Id.from(org.id),
    model: org.defaultModel,
    modelType: org.defaultModelType
      ? toModelType(org.defaultModelType)
      : ModelType.OLLAMA,
  });

  return NextResponse.json(
    DocumentCollectionResponse.fromEntity(documentCollection),
  );
}
