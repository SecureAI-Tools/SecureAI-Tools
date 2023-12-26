// A shared global instance of prisma client avoids creating multiple connections
// File name is pronounced https://www.youtube.com/watch?v=6zXDo4dL7SU
import { Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

export const prismaClient = global.prismaClient || newPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaClient = prismaClient;
}

function newPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: ["warn", "error"].concat(
      process.env.NODE_ENV === "development" ? ["query", "info"] : [],
    ) as Prisma.LogLevel[],
  });
}

export type TxPrismaClient = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
