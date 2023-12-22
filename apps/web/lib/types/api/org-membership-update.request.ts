import { OrgMembershipRole, OrgMembershipStatus } from "@repo/core";

export class OrgMembershipUpdateRequest {
  role?: OrgMembershipRole;
  status?: OrgMembershipStatus;
}
