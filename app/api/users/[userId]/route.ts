import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { UserResponse } from "lib/types/api/user.response";
import { UserService } from "lib/api/services/user.service";
import { NextResponseErrors } from "lib/api/core/utils";
import { UserUpdateRequest } from "lib/types/api/user-update-request";

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

  const userUpdateRequest = (await req.json()) as UserUpdateRequest;
  const updatedDbUser = await userService.update(userId, {
    firstName: userUpdateRequest.firstName,
    lastName: userUpdateRequest.lastName,
  });
  return NextResponse.json(UserResponse.fromEntity(updatedDbUser));
}
