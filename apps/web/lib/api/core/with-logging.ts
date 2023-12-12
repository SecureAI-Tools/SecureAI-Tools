import { NextApiRequest, NextApiResponse } from "next/types";

import getLogger from "lib/api/core/logger";

const logger = getLogger();

type ApiHandler<T> = (req: NextApiRequest, res: NextApiResponse<T>) => void;

export function withLogging<T>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    if (req.url !== "/api/health") {
      logger.info(
        `${req.method} ${req.headers.host}${req.url} : ${req.headers["user-agent"]}`,
      );
    }

    return handler(req, res);
  };
}
