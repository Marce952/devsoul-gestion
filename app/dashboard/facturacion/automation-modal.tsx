"use client";

import { useState } from "react";
import { Modal } from "@heroui/react";
import { Bell, CalendarPlus, ExternalLink } from "lucide-react";
import { useJson } from "@/lib/hooks/use-json";
import { lastMonths } from "@/lib/format";
import { selectClass } from "../finanzas/types";

type Outcome = {
  invoiceId: string;
  client: string;
  kind: "BEFORE_DUE" | "DUE_DAY" | "OVERDUE";
  recipient: string;
  status: "SENT" | "FAILED" | "SKIPPED" | "DRY_RUN";
  detail?: string;
};

type ReminderRun = { today: string; configured: boolean; dryRun: boolean; outcomes: Outcome[] };
type GenerateResult = { period: string; created: { invoiceId: string; client: string }[]; skipped: number };

const KIND_LABELS: Record<Outcome["kind"], string> = {
  BEFORE_DUE: "Por vencer",
  DUE_DAY: "Vencimiento",
  OVERDUE: "Vencida",
};

const STATUS_STYLES: Record<Outcome["status"], string> = {
  SENT: "text-green-400",
  FAILED: "text-red-400",
  SKIPPED: "text-white/40",
  DRY_RUN: "text-white/60",
};

const PERIODS = lastMonths(3)
  .reverse()
  .concat(
    (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return [{ value, label: `${d.toLocaleDateString("es-AR", { month: "long", year: "numeric" })} (próximo)` }];
    })()
  );

export function AutomationModal({
  isOpen,
  onOpenChange,
  onChanged,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const preview = useJson<ReminderRun>(isOpen ? "/api/reminders" : null);
  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 2].value);
  const [busy, setBusy] = useState<"generate" | "send" | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [sendResult, setSendResult] = useState<ReminderRun | null>(null);

  const generate = async () => {
    setBusy("generate");
    setMessage(null);
    const res = await fetch("/api/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period }),
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setMessage({ tone: "error", text: data?.error ?? "Error al generar" });
    const result = data as GenerateResult;
    setMessage({
      tone: "ok",
      text: `${result.created.length} factura(s) creada(s) para ${result.period}; ${result.skipped} contrato(s) ya tenían factura.`,
    });
    if (result.created.length) {
      onChanged();
      preview.reload();
    }
  };

  const send = async () => {
    setBusy("send");
    setMessage(null);
    const res = await fetch("/api/reminders", { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setMessage({ tone: "error", text: data?.error ?? "Error al enviar" });
    setSendResult(data as ReminderRun);
    onChanged();
    preview.reload();
  };

  const pending = preview.data?.outcomes ?? [];
  const shown = sendResult?.outcomes ?? pending;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) { setSendResult(null); setMessage(null); } }}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header className="px-6 pt-6 pb-0">
              <Modal.Heading className="text-lg font-semibold text-white">Automatizaciones</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-6 py-4 space-y-5">
              {message && (
                <p
                  className={`text-xs rounded-lg px-3 py-2 border ${
                    message.tone === "ok"
                      ? "text-acento-lima bg-acento-lima/10 border-acento-lima/20"
                      : "text-red-400 bg-red-500/10 border-red-500/20"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarPlus size={16} className="text-acento-lima" />
                  <h3 className="text-sm font-semibold text-white">Facturas recurrentes</h3>
                </div>
                <p className="text-xs text-white/50">
                  Se generan solas todos los días a las 7:00 para los contratos SaaS y de mantenimiento activos que no
                  tengan factura en el mes. Podés forzarlo para un período:
                </p>
                <div className="flex gap-2">
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className={selectClass}>
                    {PERIODS.map((p) => (
                      <option key={p.value} value={p.value} className="bg-black">
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={generate}
                    disabled={busy !== null}
                    className="flex-shrink-0 bg-acento-lima text-black text-sm font-medium rounded-lg px-4 disabled:opacity-50"
                  >
                    {busy === "generate" ? "Generando..." : "Generar"}
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-acento-lima" />
                    <h3 className="text-sm font-semibold text-white">Recordatorios por email</h3>
                  </div>
                  {preview.data && (
                    <span className={`text-[10px] ${preview.data.configured ? "text-green-400" : "text-yellow-400"}`}>
                      {preview.data.configured ? "Email configurado" : "Email sin configurar"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50">
                  Salen todos los días a las 9:00: 3 días antes, el día del vencimiento y 7 días después. Cada uno se
                  envía una sola vez por factura.
                </p>

                <div className="rounded-lg border border-white/10 divide-y divide-white/5 max-h-56 overflow-y-auto">
                  {preview.loading && !preview.data ? (
                    <p className="text-xs text-white/40 p-3">Cargando...</p>
                  ) : shown.length === 0 ? (
                    <p className="text-xs text-white/40 p-3">No hay recordatorios pendientes para hoy.</p>
                  ) : (
                    shown.map((o) => (
                      <div key={`${o.invoiceId}-${o.kind}`} className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs text-white truncate">{o.client}</p>
                          <p className="text-[10px] text-white/40 truncate">
                            {KIND_LABELS[o.kind]} · {o.recipient}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] ${STATUS_STYLES[o.status]}`} title={o.detail}>
                            {o.status === "DRY_RUN" ? "Pendiente" : o.status === "SENT" ? "Enviado" : o.status === "FAILED" ? "Falló" : "Omitido"}
                          </span>
                          <a
                            href={`/api/reminders/preview?invoiceId=${o.invoiceId}&kind=${o.kind}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver email"
                            className="text-white/40 hover:text-white"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={send}
                  disabled={busy !== null || !preview.data?.configured || pending.length === 0}
                  className="w-full text-sm border border-white/10 text-white/80 rounded-lg py-2 hover:bg-white/5 disabled:opacity-40"
                >
                  {busy === "send" ? "Enviando..." : "Enviar ahora"}
                </button>
              </section>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
