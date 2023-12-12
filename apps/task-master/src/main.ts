import { prismaClient } from "@repo/database";

async function main() {
  // TODO: Convert into logger after splitting out logger into its package!
  console.log("Starting task-master...");

  const chats = await prismaClient.chat.findMany()
  console.log(`found ${chats.length} chats`);
  console.log("chats = ", chats);
}

main();
