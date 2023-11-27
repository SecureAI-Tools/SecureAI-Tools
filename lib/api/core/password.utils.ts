import { compare, hash } from "bcrypt";

export async function hashPassword(passwordRaw: string): Promise<string> {
  return await hash(passwordRaw, 12);
}

export async function comparePasswords(
  passwordRaw: string,
  passwordHash: string,
): Promise<boolean> {
  return await compare(passwordRaw, passwordHash);
}
