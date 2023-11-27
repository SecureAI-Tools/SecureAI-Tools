import { User } from "@prisma/client";

export class UserResponse {
  id!: string;
  email!: string | null;
  firstName!: string | null;
  lastName!: string | null;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(u: User): UserResponse {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      createdAt: u.createdAt.getTime(),
      updatedAt: u.updatedAt.getTime(),
    };
  }
}
