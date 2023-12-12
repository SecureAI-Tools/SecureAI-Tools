import { User } from "@prisma/client";

export class PasswordForceResetResponse {
  forceReset!: boolean;

  static fromEntity(u: User): PasswordForceResetResponse {
    return {
      forceReset: u.forcePasswordReset,
    };
  }
}
