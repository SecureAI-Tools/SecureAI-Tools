import { prismaClient } from "@repo/database";
import { getLogger } from "@repo/core";
import amqp, { Message } from "amqplib/callback_api";

const logger = getLogger("task-master");

async function main() {
  logger.info("Starting task-master...");

  const chats = await prismaClient.chat.findMany()
  logger.info(`found ${chats.length} chats`);
  logger.info("chats ", chats);

  const rabbit_host: string = "amqp://localhost";
  const rabbit_queue_name: string = "test-queue";

  amqp.connect(rabbit_host, (err: any, conn) => {
    if (err) {
      logger.error("Error creating connection ", err);
      throw err;
    }
  
    conn.createChannel((err, channel) => {
      if (err) {
        logger.error("Error creating channel ", err);
        throw err;
      }
  
      logger.info("consumer connected");
      channel.assertQueue(rabbit_queue_name, { durable: true });
      channel.consume(
        rabbit_queue_name,
        async (data: Message | null) => {
          if (data) {
            const msg = JSON.parse(data.content.toString());
            logger.info("Received message: ", msg);
          }
        },
        { noAck: true }
      );
    });
  });
}

main();
