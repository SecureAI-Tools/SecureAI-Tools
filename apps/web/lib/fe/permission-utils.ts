import { OrgMembershipResponse } from "lib/types/api/org-membership.response";
import { OrgMembershipRole } from "lib/types/core/org-membership-role";
import { OrgMembershipStatus } from "lib/types/core/org-membership-status";

// Given a list of memberships of a user for a given org, this function determines if the user is an admin of said org.
export const isAdmin = (memberships: OrgMembershipResponse[]): boolean => {
  return memberships.some(
    (m) =>
      m.role === OrgMembershipRole.ADMIN &&
      m.status === OrgMembershipStatus.ACTIVE,
  );
};
