export enum OrgMembershipStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export const toOrgMembershipStatus = (s: string): OrgMembershipStatus =>
  OrgMembershipStatus[s as keyof typeof OrgMembershipStatus];
