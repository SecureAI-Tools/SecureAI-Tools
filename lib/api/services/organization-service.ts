import { Organization, Prisma } from "@prisma/client";

import { TxPrismaClient } from "lib/api/core/db";
import { prismaClient } from "lib/api/db";
import { OrganizationUpdateRequest } from "lib/types/api/organization-update.request";

export class OrganizationService {
  async get(orgIdOrSlug: string): Promise<Organization | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getWithTxn(tx, orgIdOrSlug);
    });
  }

  async getWithTxn(
    prisma: TxPrismaClient,
    orgIdOrSlug: string,
  ): Promise<Organization | null> {
    return await prisma.organization.findFirst({
      where: {
        OR: [{ id: orgIdOrSlug }, { slug: orgIdOrSlug }],
      },
    });
  }

  async getAll(
    where?: Prisma.OrganizationWhereInput,
    orderBy?: Prisma.OrganizationOrderByWithRelationInput,
  ): Promise<Organization[]> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<Organization[]> => {
        return await this.getAllTxn(prisma, where, orderBy);
      },
    );
  }

  async getAllTxn(
    prisma: TxPrismaClient,
    where?: Prisma.OrganizationWhereInput,
    orderBy?: Prisma.OrganizationOrderByWithRelationInput,
  ): Promise<Organization[]> {
    return await prisma.organization.findMany({
      where: where,
      orderBy: orderBy,
    });
  }

  async update(
    orgIdOrSlug: string,
    req: OrganizationUpdateRequest,
  ): Promise<Organization> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      const orgIds = await prisma.organization.findMany({
        where: {
          OR: [{ id: orgIdOrSlug }, { slug: orgIdOrSlug }],
        },
        select: {
          id: true,
        },
      });

      if (orgIds.length === 0) {
        throw new Error("invalid orgIdOrSlug", { cause: orgIdOrSlug });
      } else if (orgIds.length > 1) {
        throw new Error(
          "can not update more than one org at a time using orgIdOrSlug",
          { cause: orgIdOrSlug },
        );
      }

      return await prisma.organization.update({
        where: {
          id: orgIds[0].id,
        },
        data: {
          ...req,
        },
      });
    });
  }
}
