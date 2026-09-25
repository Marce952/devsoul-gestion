"use client";

import { useState } from "react";
import { postJson } from "@/components/form-modal";
import { useJson } from "@/lib/hooks/use-json";
import { formatAmount, formatDate, todayKey } from "@/lib/format";
import { inputClass } from "../types";

type RatesResponse = {
  casa: string;
  current: { rate: number; source: string; date: string } | null;
  history: { id: string; date: string; rateToArs: string; source: "MANUAL" | "API" }[];
};

export function RatesSection() {
  const { data, reload } = useJson<RatesResponse>("/api/exchange-rates");
  const [date, setDate] = useState(todayKey());
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(rate) > 0)) return setError("Ingresá una cotización válida.");
    setSaving(true);
    const err = await postJson("/api/exchange-rates", { date, rateToArs: Number(rate) });
    setSaving(false);
    setError(err);
    if (!err) {
      setRate("");
      reload();
    }
  };

  return (
    <section className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Cotización USD</h2>
          <p className="text-xs text-white/40">
            Automática (dólar {data?.casa ?? "oficial"}, venta). Los movimientos en USD guardan la cotización del día.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-acento-lima">
            {data?.current ? formatAmount(data.current.rate) : "—"}
          </p>
          <p className="text-[10px] text-white/40">
            {data?.current ? `${formatDate(data.current.date)} · ${data.current.source === "MANUAL" ? "manual" : "API"}` : "Sin cotización"}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[130px]">
          <label className="text-xs text-white/50 mb-1 block">Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="text-xs text-white/50 mb-1 block">ARS por USD</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="1500"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="text-sm border border-white/10 text-white/80 rounded-lg px-4 py-2 hover:bg-white/5 disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Cargar manual"}
        </button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {data && data.history.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.history.map((h) => (
            <div key={h.id} className="flex-shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-center">
              <p className="text-[10px] text-white/40">{formatDate(h.date)}</p>
              <p className="text-xs text-white">{formatAmount(h.rateToArs)}</p>
              <p className="text-[9px] text-white/30">{h.source === "MANUAL" ? "manual" : "API"}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
