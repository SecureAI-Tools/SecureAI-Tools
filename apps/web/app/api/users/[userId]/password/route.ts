import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PasswordUpdateRequest } from "lib/types/api/password-update.request";
import { UserResponse } from "lib/types/api/user.response";
import { UserService } from "lib/api/services/user.service";
import { comparePasswords } from "lib/api/core/password.utils";
import { NextResponseErrors } from "lib/api/core/utils";

const userService = new UserService();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const [authenticated, authenticatedUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permissions
  const userId = Id.from<UserResponse>(params.userId);
  if (!userId.equals(authenticatedUserId!)) {
    return NextResponseErrors.forbidden();
  }

  const { oldPassword, newPassword } =
    (await req.json()) as PasswordUpdateRequest;
  const dbUser = await userService.get(userId);
  if (!dbUser) {
    return NextResponseErrors.notFound();
  }

  const passwordsMatch = await comparePasswords(
    oldPassword,
    dbUser.passwordHash,
  );
  if (!passwordsMatch) {
    return NextResponseErrors.badRequest();
  }

  const updatedDbUser = await userService.updatePassword(userId, newPassword);
  return NextResponse.json(UserResponse.fromEntity(updatedDbUser));
}
