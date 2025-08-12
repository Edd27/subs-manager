import { Queue, type QueueOptions } from "bullmq";

const connection = (): NonNullable<QueueOptions["connection"]> => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const { hostname, port } = new URL(url);
  return { host: hostname, port: Number(port) } as {
    host: string;
    port: number;
  };
};

export const emailQueue = new Queue("email", { connection: connection() });
export const smsQueue = new Queue("sms", { connection: connection() });
export const statementQueue = new Queue("statement", {
  connection: connection(),
});
