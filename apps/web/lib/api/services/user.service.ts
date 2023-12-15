import { Prisma, User, TxPrismaClient, prismaClient } from "@repo/database";
import { UserResponse } from "@repo/core";
import { Id } from "@repo/core";

import { hashPassword } from "lib/api/core/password.utils";

export class UserCreateInput {
  email!: string;
  password!: string;
  forcePasswordReset!: boolean;
  firstName: string | undefined;
  lastName: string | undefined;
}

export class UserService {
  async create(u: UserCreateInput): Promise<User> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return this.createWithTxn(tx, u);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    u: UserCreateInput,
  ): Promise<User> {
    const newUser = await prisma.user.create({
      data: {
        id: Id.generate(UserResponse).toString(),
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash: await hashPassword(u.password),
        forcePasswordReset: u.forcePasswordReset,
      },
    });

    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.findByEmailWithTxn(tx, email);
    });
  }

  async findByEmailWithTxn(
    prisma: TxPrismaClient,
    email: string,
  ): Promise<User | null> {
    return await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async get(id: Id<UserResponse>): Promise<User | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getWithTxn(tx, id);
    });
  }

  async getWithTxn(
    prisma: TxPrismaClient,
    id: Id<UserResponse>,
  ): Promise<User | null> {
    return await prisma.user.findUnique({
      where: {
        id: id.toString(),
      },
    });
  }

  async updatePassword(
    id: Id<UserResponse>,
    newPassword: string,
  ): Promise<User> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.user.update({
        where: {
          id: id.toString(),
        },
        data: {
          passwordHash: await hashPassword(newPassword),
          // can safely set this to false now that the password has been reset!
          forcePasswordReset: false,
        },
      });
    });
  }

  async update(
    id: Id<UserResponse>,
    input: Prisma.UserUpdateInput,
  ): Promise<User> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.user.update({
        where: {
          id: id.toString(),
        },
        data: input,
      });
    });
  }
}
