import { getAMQPChannel } from "@repo/core/src/amqp-client";
import { getLogger } from "@repo/core/src/logger";
import { IndexingQueueMessage } from "@repo/core/src/types/indexing-queue-message";
import { IndexingService } from "@repo/core/src/services/indexing-service";
import { Id } from "@repo/core/src/types/id";

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

  // This consumes all messages at once in parallel. This can overwhelm the LLM.
  // TODO: Optimize this so it only consumes max N messages at a time. We may need to do
  // prefetch with ack: https://amqp-node.github.io/amqplib/channel_api.html#channel_prefetch
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
      }
    },
    { noAck: true }
  );
}

main();
