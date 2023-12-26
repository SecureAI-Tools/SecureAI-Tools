import { Id, IndexingQueueMessage } from "@repo/core";
import { IndexingService, getAMQPChannel, getLogger } from "@repo/backend";

const logger = getLogger("task-master");
const indexingService = new IndexingService();

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

  // We are consuming one message at a time for now.
  channel.prefetch(1);

  channel.consume(
    queueName,
    async (data) => {
      if (data) {
        const msg = JSON.parse(data.content.toString()) as IndexingQueueMessage;
        logger.info("Received message: ", msg);
        const asyncGenerator = indexingService.index(Id.from(msg.documentId));
        for await (const chunk of asyncGenerator) {
          logger.info(`[doc = ${msg.documentId}] chunk`, chunk);
        }
        channel.ack(data)
      }
    },
    { noAck: false }
  );
}

main();
