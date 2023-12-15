import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { UserService } from "lib/api/services/user.service";
import { PasswordForceResetResponse } from "lib/types/api/password-force-reset.response";
import { NextResponseErrors } from "@repo/core";

const userService = new UserService();

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permissions
  if (userId?.toString() !== params.userId) {
    return NextResponseErrors.forbidden();
  }

  const user = await userService.get(userId);
  if (!user) {
    return NextResponseErrors.notFound();
  }
  return NextResponse.json(PasswordForceResetResponse.fromEntity(user));
}
