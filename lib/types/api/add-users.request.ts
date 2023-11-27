import { OrgMembershipRole } from "lib/types/core/org-membership-role";

export class AddUsersRequest {
  users!: AddUserRequest[];
}

export class AddUserRequest {
  firstName!: string;
  lastName!: string;
  email!: string;
  password!: string;
  role!: OrgMembershipRole;
}
