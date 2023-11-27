import { OrgMembershipRole } from "lib/types/core/org-membership-role";
import { OrgMembershipStatus } from "lib/types/core/org-membership-status";

export class OrgMembershipUpdateRequest {
  role?: OrgMembershipRole;
  status?: OrgMembershipStatus;
}
