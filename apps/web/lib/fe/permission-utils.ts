import {
  OrgMembershipResponse,
  OrgMembershipRole,
  OrgMembershipStatus,
} from "@repo/core";

// Given a list of memberships of a user for a given org, this function determines if the user is an admin of said org.
export const isAdmin = (memberships: OrgMembershipResponse[]): boolean => {
  return memberships.some(
    (m) =>
      m.role === OrgMembershipRole.ADMIN &&
      m.status === OrgMembershipStatus.ACTIVE,
  );
};
