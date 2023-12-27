import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

import { isAuthenticated } from "lib/api/core/auth";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { OrganizationService } from "lib/api/services/organization-service";
import { DocumentCollectionCreateRequest } from "lib/types/api/document-collection-create.request";

import {
  removeTrailingSlash,
  Id,
  toModelType,
  ModelType,
  DocumentCollectionResponse,
} from "@repo/core";
import {
  DocumentCollectionService,
  NextResponseErrors,
  API,
} from "@repo/backend";

const orgMembershipService = new OrgMembershipService();
const orgService = new OrganizationService();
const documentCollectionService = new DocumentCollectionService();
const chromaClient = new ChromaClient({
  path: removeTrailingSlash(process.env.VECTOR_DB_SERVER!),
});

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
    description: documentCollectionCreateRequest.description,
    ownerId: userId!,
    orgId: Id.from(org.id),
    model: org.defaultModel,
    modelType: org.defaultModelType
      ? toModelType(org.defaultModelType)
      : ModelType.OLLAMA,
  });

  // Create corresponding collection in vector db
  const collection = await chromaClient.createCollection({
    name: documentCollection.internalName,
  });

  return NextResponse.json(
    DocumentCollectionResponse.fromEntity(documentCollection),
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orgIdOrSlug: string } },
) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.orgIdOrSlug.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");
  if (authUserId?.toString() !== userIdParam) {
    // TODO: In future, allow org admins to call this endpoint
    return NextResponseErrors.forbidden();
  }

  const org = await orgService.get(params.orgIdOrSlug);
  if (!org) {
    return NextResponseErrors.notFound();
  }

  const hasPermissions = await orgMembershipService.isActiveMember(
    authUserId!,
    params.orgIdOrSlug,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  // Get documents by ownerId and org.id
  const where = {
    ownerId: authUserId.toString(),
    organizationId: org.id,
  };
  const documentCollections = await documentCollectionService.getAll({
    where: where,
    orderBy: API.searchParamsToOrderByInput(searchParams),
    pagination: API.PaginationParams.from(searchParams),
  });
  const count = await documentCollectionService.count(where);

  return NextResponse.json(
    documentCollections.map((dc) => DocumentCollectionResponse.fromEntity(dc)),
    {
      headers: API.createResponseHeaders({
        pagination: {
          totalCount: count,
        },
      }),
    },
  );
}
