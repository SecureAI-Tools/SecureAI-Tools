import { NextRequest, NextResponse } from "next/server";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatService } from "lib/api/services/chat-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatUpdateRequest } from "lib/types/api/chat-update.request";
import { NextResponseErrors } from "lib/api/core/utils";
import { UserService } from "lib/api/services/user.service";
import { PasswordForceResetResponse } from "lib/types/api/password-force-reset.response";

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
