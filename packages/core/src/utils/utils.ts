import { NextApiResponse } from "next/types";
import { StatusCodes } from "http-status-codes";

import { NextResponse } from "next/server";
import { ErrorResponse } from "../types/error.response";

export async function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function sendForbiddenError<T>(
  res: NextApiResponse<T | ErrorResponse>,
  msg: string = "insufficient permission",
) {
  res.status(StatusCodes.FORBIDDEN).json({ error: msg });
}

export function sendNotFoundError<T>(
  res: NextApiResponse<T | ErrorResponse>,
  msg: string = "object not found",
) {
  res.status(StatusCodes.NOT_FOUND).json({ error: msg });
}

export function sendUnauthorizedError<T>(
  res: NextApiResponse<T | ErrorResponse>,
  msg: string = "unauthorized",
) {
  res.status(StatusCodes.UNAUTHORIZED).json({ error: msg });
}

export function sendBadRequestError<T>(
  res: NextApiResponse<T | ErrorResponse>,
  msg: string = "invalid request",
) {
  res.status(StatusCodes.BAD_REQUEST).json({ error: msg });
}

export function sendInternalServerError<T>(
  res: NextApiResponse<T | ErrorResponse>,
  msg: string = "Uh oh! Something went wrong",
) {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: msg });
}

export function sendUnsupportedMethodError<T>(
  res: NextApiResponse<T | ErrorResponse>,
) {
  // Should this be a Bad Request error, or NOT_FOUND?
  res.status(StatusCodes.BAD_REQUEST).json({ error: "Unsupported  method" });
}

export namespace NextResponseErrors {
  export function forbidden(
    error: string = "insufficient permission",
  ): NextResponse {
    return NextResponse.json(
      { error: error },
      { status: StatusCodes.FORBIDDEN },
    );
  }

  export function notFound(error: string = "object not found"): NextResponse {
    return NextResponse.json(
      { error: error },
      { status: StatusCodes.NOT_FOUND },
    );
  }

  export function unauthorized(error: string = "unauthorized"): NextResponse {
    return NextResponse.json(
      { error: error },
      { status: StatusCodes.UNAUTHORIZED },
    );
  }

  export function badRequest(error: string = "invalid request"): NextResponse {
    return NextResponse.json(
      { error: error },
      { status: StatusCodes.BAD_REQUEST },
    );
  }

  export function internalServerError(
    error: string = "Uh oh! Something went wrong",
  ): NextResponse {
    return NextResponse.json(
      { error: error },
      { status: StatusCodes.INTERNAL_SERVER_ERROR },
    );
  }
}
