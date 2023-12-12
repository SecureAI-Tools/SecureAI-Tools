import NextAuth, { AuthOptions } from "next-auth";
import { User as NextAuthUser, Session } from "next-auth/core/types";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import moment from "moment";

import { prismaClient } from "lib/api/db";
import { FrontendRoutes } from "lib/fe/routes";
import { UserService } from "lib/api/services/user.service";
import { TokenUser } from "lib/types/core/token-user";
import { comparePasswords } from "lib/api/core/password.utils";
import { User } from "@prisma/client";

const jwtMaxAgeSeconds =
  parseInt(process.env.AUTH_TOKEN_VALIDITY_HOURS!) * 60 * 60;
const userService = new UserService();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prismaClient),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Email",
          type: "email",
          placeholder: "bruce@wayne-enterprises.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        const dbUser = await userService.findByEmail(username.toLowerCase());

        if (dbUser) {
          const isValid = await comparePasswords(password, dbUser.passwordHash);
          if (isValid) {
            return {
              id: dbUser.id,
              email: dbUser.email,
            };
          }
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: jwtMaxAgeSeconds,
  },
  jwt: {
    maxAge: jwtMaxAgeSeconds,
  },
  pages: {
    signIn: FrontendRoutes.LOG_IN,
    signOut: FrontendRoutes.LOG_OUT,
    error: FrontendRoutes.LOG_IN_ERROR, // Error code passed in query string as ?error=
  },
  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
  },
};

export default NextAuth(authOptions);

async function jwtCallback({
  token,
  user,
  trigger,
}: {
  token: JWT;
  user?: NextAuthUser;
  isNewUser?: boolean;
  trigger?: "signIn" | "signUp" | "update";
}): Promise<JWT> {
  if (trigger === "signIn" && user) {
    return await prismaClient.$transaction(async (tx) => {
      let dbUser = await tx.user.findUnique({
        where: { email: user.email! },
      });

      if (!dbUser) {
        throw new Error("no user and jwtCallback called!");
      }

      token.user = dbUserToTokenUser(dbUser);
      token.issued = moment().toISOString();
      return token;
    });
  } else if (trigger === "update") {
    return await prismaClient.$transaction(async (tx) => {
      // Note: Do not rely on the session data coming from FE. We must only rely on the previous token user id and existing data from DB to create a new token user.
      const jwtTokenUser = token.user as TokenUser;
      let dbUser = await tx.user.findUnique({
        where: { id: jwtTokenUser.id },
      });

      if (!dbUser) {
        throw new Error(`no user for given jwt token (${jwtTokenUser.id})!`);
      }

      token.user = dbUserToTokenUser(dbUser);
      return token;
    });
  }

  return token;
}

async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  user: NextAuthUser;
  token: JWT;
}): Promise<Session> {
  return {
    ...session,
    user: token.user,
    issued: token.issued,
  } as Session;
}

function dbUserToTokenUser(dbUser: User): TokenUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
  };
}
