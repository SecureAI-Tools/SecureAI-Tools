import { Organization } from "@prisma/client";

export class OrganizationResponse {
  id!: string;
  name!: string;
  slug!: string;
  defaultModel!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: Organization): OrganizationResponse {
    return {
      id: e.id,
      name: e.name,
      slug: e.slug,
      defaultModel: e.defaultModel,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
