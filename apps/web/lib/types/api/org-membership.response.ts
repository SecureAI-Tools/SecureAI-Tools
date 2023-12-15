import { OrgMembership, User } from "@repo/database";
import {
  OrgMembershipRole,
  toOrgMembershipRole,
} from "../core/org-membership-role";
import {
  OrgMembershipStatus,
  toOrgMembershipStatus,
} from "../core/org-membership-status";
import { UserResponse } from "@repo/core/src/types/user.response";

export class OrgMembershipResponse {
  id!: string;
  role!: OrgMembershipRole;
  status!: OrgMembershipStatus;
  orgId!: string;
  createdAt!: number;
  updatedAt!: number;
  user?: UserResponse;

  static fromEntity(e: OrgMembership, user?: User): OrgMembershipResponse {
    return {
      id: e.id,
      role: toOrgMembershipRole(e.role),
      status: toOrgMembershipStatus(e.status),
      orgId: e.orgId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
      user: user ? UserResponse.fromEntity(user) : undefined,
    };
  }
}
