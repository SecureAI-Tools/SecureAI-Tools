import { prismaClient } from "@repo/database";
import { getLogger } from "@repo/core";

const logger = getLogger("task-master");

async function main() {
  logger.info("Starting task-master...");

  const chats = await prismaClient.chat.findMany()
  logger.info(`found ${chats.length} chats`);
  logger.info("chats ", chats);
}

main();
