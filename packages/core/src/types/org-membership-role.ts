export enum OrgMembershipRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export const toOrgMembershipRole = (s: string): OrgMembershipRole =>
  OrgMembershipRole[s as keyof typeof OrgMembershipRole];
