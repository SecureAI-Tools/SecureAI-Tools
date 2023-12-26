import { User } from "@repo/database";

export class PasswordForceResetResponse {
  forceReset!: boolean;

  static fromEntity(u: User): PasswordForceResetResponse {
    return {
      forceReset: u.forcePasswordReset,
    };
  }
}
