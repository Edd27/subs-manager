import { Queue, Worker, type WorkerOptions } from "bullmq";
import { Resend } from "resend";

const connection = (): NonNullable<WorkerOptions["connection"]> => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const { hostname, port } = new URL(url);
  return { host: hostname, port: Number(port) } as {
    host: string;
    port: number;
  };
};

const resend = new Resend(process.env.RESEND_API_KEY || "");

new Worker(
  "email",
  async (job) => {
    const { to, subject, html } = job.data as {
      to: string;
      subject: string;
      html: string;
    };
    if (!process.env.RESEND_API_KEY) return true;
    await resend.emails.send({
      from: "no-reply@subs.local",
      to,
      subject,
      html,
    });
    return true;
  },
  { connection: connection() }
);

new Worker(
  "statement",
  async (job) => {
    return true;
  },
  { connection: connection() }
);

new Worker(
  "sms",
  async () => {
    return true;
  },
  { connection: connection() }
);

if (process.env.JOB_SCHEDULER === "true") {
  const q = new Queue("statement", { connection: connection() });
  q.add(
    "monthly",
    {},
    {
      repeat: { pattern: "0 8 1 * *" },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}
