import { getToken } from "next-auth/jwt";
import { NextApiResponse, NextApiRequest } from "next";
import { NextRequest } from "next/server";

import { TokenUser } from "lib/types/core/token-user";
import { UserService } from "lib/api/services/user.service";

import { ErrorResponse } from "@repo/core/src/types/error.response";
import { Id } from "@repo/core/src/types/id";
import { UserResponse } from "@repo/core/src/types/user.response";
import { sendUnauthorizedError } from "@repo/core/src/utils/utils";

const userService = new UserService();

export async function isAuthenticated<T>(
  req: NextApiRequest | NextRequest,
  res?: NextApiResponse<T | ErrorResponse> | undefined,
): Promise<[boolean, Id<UserResponse> | undefined]> {
  const token = await getToken({ req });

  if (token) {
    const userId = Id.from<UserResponse>((token.user as TokenUser).id);
    const user = await userService.get(userId);
    if (user) {
      return [true, userId];
    }
  }

  if (res) {
    sendUnauthorizedError(res);
  }

  return [false, undefined];
}
