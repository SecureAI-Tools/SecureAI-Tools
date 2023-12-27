import { AddUserRequest } from "lib/types/api/add-users.request";
import { OrgMembershipUpdateRequest } from "lib/types/api/org-membership-update.request";
import { OrganizationService } from "lib/api/services/organization-service";
import { UserService } from "lib/api/services/user.service";

import {
  Organization,
  OrgMembership,
  Prisma,
  User,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";
import { API } from "@repo/backend";
import { Id, IdType, OrgMembershipRole, OrgMembershipStatus } from "@repo/core";

export interface AddUserResult {
  // Created or updated membership
  membership: OrgMembership;

  // Indicates whether a new membership was created
  membershipCreated: boolean;

  // The user for the membership
  user: User;

  // Indicates whether a new user was created
  userCreated: boolean;
}

export class OrgMembershipService {
  private userService = new UserService();
  private organizationService = new OrganizationService();

  async addUsers(
    requests: AddUserRequest[],
    orgIdOrSlug: string,
  ): Promise<AddUserResult[]> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return this.addUsersTxn(prisma, requests, orgIdOrSlug);
    });
  }

  async addUsersTxn(
    prisma: TxPrismaClient,
    requests: AddUserRequest[],
    orgIdOrSlug: string,
  ): Promise<AddUserResult[]> {
    const org = await this.organizationService.getWithTxn(prisma, orgIdOrSlug);
    if (!org) {
      throw new Error(`invalid orgIdOrSlug ${orgIdOrSlug}`);
    }

    const orgMembershipPromises = requests.map(
      async (req): Promise<AddUserResult> => {
        // Check if user with email exists
        let dbUser = await this.userService.findByEmailWithTxn(
          prisma,
          req.email,
        );
        const isUserCreated = !dbUser;
        if (!dbUser) {
          // user does not exist -- create one
          dbUser = await this.userService.createWithTxn(prisma, {
            ...req,
            forcePasswordReset: true,
          });
        }

        // Upsert membership
        const membership = await prisma.orgMembership.findFirst({
          where: {
            userId: dbUser.id,
            OR: [{ orgId: orgIdOrSlug }, { org: { slug: orgIdOrSlug } }],
          },
        });

        if (membership) {
          const updatedMembership = await prisma.orgMembership.update({
            data: {
              role: req.role,
            },
            where: {
              id: membership.id,
            },
          });

          return {
            membership: updatedMembership,
            membershipCreated: false,
            user: dbUser,
            userCreated: isUserCreated,
          };
        }

        // no membership -- create one
        const createdMembership = await prisma.orgMembership.create({
          data: {
            id: Id.generate<IdType.OrgMembership>().toString(),
            userId: dbUser.id,
            orgId: org.id,
            role: req.role,
            status: OrgMembershipStatus.ACTIVE,
          },
        });

        return {
          membership: createdMembership,
          membershipCreated: true,
          user: dbUser,
          userCreated: isUserCreated,
        };
      },
    );

    return await Promise.all(orgMembershipPromises);
  }

  async get(id: Id<IdType.OrgMembership>): Promise<OrgMembership | null> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await this.getTxn(prisma, id);
    });
  }

  async getTxn(
    prisma: TxPrismaClient,
    id: Id<IdType.OrgMembership>,
  ): Promise<OrgMembership | null> {
    return await prisma.orgMembership.findUnique({
      where: {
        id: id.toString(),
      },
    });
  }

  async getAll(
    where?: Prisma.OrgMembershipWhereInput,
    orderBy?: Prisma.OrgMembershipOrderByWithRelationInput,
  ): Promise<OrgMembership[]> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await this.getAllTxn(prisma, where, orderBy);
    });
  }

  async getAllTxn(
    prisma: TxPrismaClient,
    where?: Prisma.OrgMembershipWhereInput,
    orderBy?: Prisma.OrgMembershipOrderByWithRelationInput,
  ): Promise<OrgMembership[]> {
    return await prisma.orgMembership.findMany({
      where: where,
      orderBy: orderBy,
    });
  }

  async getAllIncludingUser(
    where?: Prisma.OrgMembershipWhereInput,
    orderBy?: Prisma.OrgMembershipOrderByWithRelationInput,
    pagination?: API.PaginationParams,
  ): Promise<(OrgMembership & { user: User })[]> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.orgMembership.findMany({
        where: where,
        orderBy: orderBy,
        include: {
          user: true,
        },
        skip: pagination?.skip(),
        take: pagination?.take(),
      });
    });
  }

  async getAllIncludingOrganization({
    where,
    orderBy,
  }: {
    where?: Prisma.OrgMembershipWhereInput;
    orderBy?: Prisma.OrgMembershipOrderByWithRelationInput;
  }): Promise<(OrgMembership & { org: Organization })[]> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.orgMembership.findMany({
        where: where,
        orderBy: orderBy,
        include: {
          org: true,
        },
      });
    });
  }

  async countAll(where?: Prisma.OrgMembershipWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.orgMembership.count({
        where: where,
      });
    });
  }

  async isActiveMember(
    userId: Id<IdType.User>,
    orgIdOrSlug: string,
  ): Promise<boolean> {
    return this.hasPermission(userId, orgIdOrSlug, [
      OrgMembershipRole.ADMIN,
      OrgMembershipRole.USER,
    ]);
  }

  // Checks if given userId has permission to read orgId's data
  //
  // The user must be either an ADMIN or a USER of that organization
  async hasReadPermission(
    userId: Id<IdType.User>,
    orgIdOrSlug: string,
  ): Promise<boolean> {
    return this.hasPermission(userId, orgIdOrSlug, [
      OrgMembershipRole.ADMIN,
      OrgMembershipRole.USER,
    ]);
  }

  // Checks if given userId has admin permission to orgId
  async hasAdminPermission(
    userId: Id<IdType.User>,
    orgIdOrSlug: string,
  ): Promise<boolean> {
    return this.hasPermission(userId, orgIdOrSlug, [OrgMembershipRole.ADMIN]);
  }

  async hasPermission(
    userId: Id<IdType.User>,
    orgIdOrSlug: string,
    roles: OrgMembershipRole[],
  ): Promise<boolean> {
    return prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      const count = await prisma.orgMembership.count({
        where: {
          userId: userId.toString(),
          role: roles.length === 1 ? roles[0] : { in: roles },
          status: OrgMembershipStatus.ACTIVE,
          OR: [{ orgId: orgIdOrSlug }, { org: { slug: orgIdOrSlug } }],
        },
      });

      return count > 0;
    });
  }

  async update(
    id: Id<IdType.OrgMembership>,
    req: OrgMembershipUpdateRequest,
  ): Promise<OrgMembership | null> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.orgMembership.update({
        where: {
          id: id.toString(),
        },
        data: {
          ...req,
        },
      });
    });
  }
}
