import "server-only";
import { NotificationChannel } from "@prisma/client";

export type OutgoingMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type SendResult = { ok: true; providerId: string | null } | { ok: false; error: string };

export interface Notifier {
  channel: NotificationChannel;
  isConfigured(): boolean;
  send(message: OutgoingMessage): Promise<SendResult>;
}

const resendEmail: Notifier = {
  channel: NotificationChannel.EMAIL,
  isConfigured: () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  async send(message) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(process.env.EMAIL_REPLY_TO && { reply_to: process.env.EMAIL_REPLY_TO }),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${data?.message ?? res.statusText}` };
      return { ok: true, providerId: data?.id ?? null };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Error de red" };
    }
  },
};

const notifiers: Partial<Record<NotificationChannel, Notifier>> = {
  [NotificationChannel.EMAIL]: resendEmail,
};

export function getNotifier(channel: NotificationChannel) {
  const notifier = notifiers[channel];
  return notifier?.isConfigured() ? notifier : null;
}
