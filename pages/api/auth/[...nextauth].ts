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
}: {
  token: JWT;
  user?: NextAuthUser;
  isNewUser?: boolean;
}): Promise<JWT> {
  return await prismaClient.$transaction(async (tx) => {
    if (user) {
      let dbUser = await tx.user.findFirst({
        where: { email: user.email! },
      });

      if (!dbUser) {
        throw new Error("no user and jwtCallback called!");
      }

      const tokenUser: TokenUser = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
      };
      token.user = tokenUser;
      token.issued = moment().toISOString();
    }

    return token;
  });
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
