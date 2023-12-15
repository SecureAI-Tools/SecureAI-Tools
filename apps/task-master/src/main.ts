import { prismaClient } from "@repo/database";
import { getAMQPChannel } from "@repo/core/src/amqp-client";
import { getLogger } from "@repo/core/src/logger";
import { IndexingQueueMessage } from "@repo/core/src/types/indexing-queue-message";

const logger = getLogger("task-master");

async function main() {
  logger.info("Starting task-master...");

  const amqpServerUrl = process.env.AMQP_SERVER_URL;
  if (!amqpServerUrl) {
    throw new Error("Invalid AMQP_SERVER_URL");
  }
  const queueName = process.env.AMQP_DOCS_INDEXING_QUEUE_NAME;
  if (!queueName) {
    throw new Error("Invalid AMQP_DOCS_INDEXING_QUEUE_NAME");
  }

  const channel = await getAMQPChannel(amqpServerUrl);
  await channel.assertQueue(queueName);

  channel.consume(
    queueName,
    async (data) => {
      if (data) {
        const msg = JSON.parse(data.content.toString()) as IndexingQueueMessage;
        logger.info("Received message: ", msg);
        const document = await prismaClient.document.findUnique({
          where: {
            id: msg.documentId,
          }
        });

        logger.info("document = ", document);
      }
    },
    { noAck: true }
  );
}

main();
