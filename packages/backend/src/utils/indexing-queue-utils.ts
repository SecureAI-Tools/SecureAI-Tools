import { IndexingQueueMessage } from "@repo/core";
import { getAMQPChannel } from "../amqp-client";

export async function addToIndexingQueue(msg: IndexingQueueMessage): Promise<void> {
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
  await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)));
}
