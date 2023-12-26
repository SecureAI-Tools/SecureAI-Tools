import { OrgMembershipRole } from "@repo/core";

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
