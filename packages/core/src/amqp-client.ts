import amqp from "amqplib";

let channel: amqp.Channel | undefined = undefined;

export async function getAMQPChannel(url: string): Promise<amqp.Channel> {
  if (!channel) {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
  }

  return channel;
}
