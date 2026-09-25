import type { ReminderKind } from "@prisma/client";
import { formatAmount, formatDate, type CurrencyCode } from "@/lib/format";

export type ReminderData = {
  kind: ReminderKind;
  contactName: string;
  companyName: string;
  softwareName: string;
  period: string;
  amount: string | number;
  currency: CurrencyCode;
  dueDate: Date;
  daysFromDue: number;
  paymentUrl?: string | null;
};

const ACCENT = "#bdf61d";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function copy(data: ReminderData) {
  const due = formatDate(data.dueDate);
  switch (data.kind) {
    case "BEFORE_DUE":
      return {
        subject: `Recordatorio: tu factura de ${data.softwareName} vence el ${due}`,
        headline: "Tu factura vence pronto",
        body: `Te recordamos que la factura del período ${data.period} vence el ${due}.`,
      };
    case "DUE_DAY":
      return {
        subject: `Tu factura de ${data.softwareName} vence ${data.daysFromDue === 0 ? "hoy" : `desde el ${due}`}`,
        headline: data.daysFromDue === 0 ? "Tu factura vence hoy" : "Tu factura está vencida",
        body:
          data.daysFromDue === 0
            ? `La factura del período ${data.period} vence hoy, ${due}.`
            : `La factura del período ${data.period} venció el ${due}.`,
      };
    case "OVERDUE":
      return {
        subject: `Factura vencida de ${data.softwareName} — período ${data.period}`,
        headline: "Tenés una factura vencida",
        body: `La factura del período ${data.period} venció el ${due} y todavía figura como pendiente de pago.`,
      };
  }
}

export function renderReminderEmail(data: ReminderData) {
  const { subject, headline, body } = copy(data);
  const amount = formatAmount(data.amount, data.currency);
  const name = escapeHtml(data.contactName);
  const rows: [string, string][] = [
    ["Cliente", data.companyName],
    ["Servicio", data.softwareName],
    ["Período", data.period],
    ["Vencimiento", formatDate(data.dueDate)],
    ["Importe", amount],
  ];

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0d0d0d;border:1px solid #222222;border-radius:16px;">
        <tr><td style="padding:24px 24px 8px;">
          <span style="font-size:22px;font-weight:bold;color:${ACCENT};letter-spacing:-0.5px;">Devsoul</span>
        </td></tr>
        <tr><td style="padding:8px 24px 0;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">${escapeHtml(headline)}</h1>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#cccccc;">Hola ${name},</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#cccccc;">${escapeHtml(body)}</p>
        </td></tr>
        <tr><td style="padding:0 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #222222;border-radius:12px;">
            ${rows
              .map(
                ([label, value], i) => `<tr>
              <td style="padding:10px 14px;font-size:13px;color:#888888;${i ? "border-top:1px solid #222222;" : ""}">${label}</td>
              <td align="right" style="padding:10px 14px;font-size:13px;color:${label === "Importe" ? ACCENT : "#ffffff"};font-weight:${label === "Importe" ? "bold" : "normal"};${i ? "border-top:1px solid #222222;" : ""}">${escapeHtml(value)}</td>
            </tr>`
              )
              .join("")}
          </table>
        </td></tr>
        ${
          data.paymentUrl
            ? `<tr><td align="center" style="padding:20px 24px 0;">
          <a href="${escapeHtml(data.paymentUrl)}" style="display:inline-block;background:${ACCENT};color:#000000;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:10px;">Pagar ahora</a>
        </td></tr>`
            : ""
        }
        <tr><td style="padding:20px 24px 24px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#777777;">Si ya realizaste el pago, ignorá este mensaje. Ante cualquier duda respondé este email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Hola ${data.contactName},`,
    "",
    body,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(data.paymentUrl ? ["", `Pagar: ${data.paymentUrl}`] : []),
    "",
    "Si ya realizaste el pago, ignorá este mensaje.",
    "— Devsoul",
  ].join("\n");

  return { subject, html, text };
}
