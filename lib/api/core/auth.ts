import { getToken } from "next-auth/jwt";
import { NextApiResponse, NextApiRequest } from "next";
import { NextRequest } from "next/server";

import { ErrorResponse } from "lib/types/api/error.response";
import { Id } from "lib/types/core/id";
import { sendUnauthorizedError } from "lib/api/core/utils";
import { UserResponse } from "lib/types/api/user.response";
import { TokenUser } from "lib/types/core/token-user";

export async function isAuthenticated<T>(
  req: NextApiRequest | NextRequest,
  res?: NextApiResponse<T | ErrorResponse> | undefined,
): Promise<[boolean, Id<UserResponse> | undefined]> {
  const token = await getToken({ req });

  if (token) {
    return [true, Id.from((token.user as TokenUser).id)];
  }

  if (res) {
    sendUnauthorizedError(res);
  }

  return [false, undefined];
}
