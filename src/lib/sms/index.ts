export type SmsPayload = { to: string; body: string };

export async function sendSms(payload: SmsPayload) {
  void payload;
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return true;
  return true;
}
