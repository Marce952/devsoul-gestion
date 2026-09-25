"use client";

import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { Field, FormModal, postJson } from "@/components/form-modal";
import { todayKey } from "@/lib/format";
import { inputClass, selectClass, type Account } from "./types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSaved: () => void;
};

type Form = {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  amountReceived: string;
  date: string;
  description: string;
};

export function TransferModal({ isOpen, onOpenChange, accounts, onSaved }: Props) {
  const [form, setForm] = useState<Form>(() => initialForm(accounts));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setForm(initialForm(accounts));
      setError(null);
    }
  }

  const from = accounts.find((a) => a.id === form.fromAccountId);
  const to = accounts.find((a) => a.id === form.toAccountId);
  const crossCurrency = Boolean(from && to && from.currency !== to.currency);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!from || !to || from.id === to.id) {
      setError("Elegí dos cuentas distintas.");
      return;
    }
    if (!(Number(form.amount) > 0) || (crossCurrency && !(Number(form.amountReceived) > 0))) {
      setError("Ingresá montos válidos.");
      return;
    }
    setSaving(true);
    setError(null);
    const err = await postJson("/api/transfers", {
      fromAccountId: from.id,
      toAccountId: to.id,
      amount: Number(form.amount),
      amountReceived: crossCurrency ? Number(form.amountReceived) : undefined,
      date: form.date,
      description: form.description || undefined,
    });
    setSaving(false);
    if (err) return setError(err);
    onOpenChange(false);
    onSaved();
  };

  const accountSelect = (key: "fromAccountId" | "toAccountId") => (
    <select value={form[key]} onChange={(e) => set(key, e.target.value)} className={selectClass}>
      {accounts.map((a) => (
        <option key={a.id} value={a.id} className="bg-black">
          {a.name} ({a.currency})
        </option>
      ))}
    </select>
  );

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Transferencia entre cuentas"
      error={error}
      saving={saving}
      submitLabel="Transferir"
      onSubmit={submit}
    >
      {accounts.length < 2 ? (
        <p className="text-sm text-white/50">Necesitás al menos dos cuentas activas para transferir.</p>
      ) : (
        <>
          <Field label="Desde *">{accountSelect("fromAccountId")}</Field>
          <div className="flex justify-center text-white/30">
            <ArrowDown size={16} />
          </div>
          <Field label="Hacia *">{accountSelect("toAccountId")}</Field>

          <div className="flex gap-3">
            <Field label={`Monto enviado * ${from ? `(${from.currency})` : ""}`}>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className={inputClass}
              />
            </Field>
            {crossCurrency && (
              <Field label={`Monto recibido * (${to?.currency})`}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={form.amountReceived}
                  onChange={(e) => set("amountReceived", e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}
          </div>
          {crossCurrency && Number(form.amount) > 0 && Number(form.amountReceived) > 0 && (
            <p className="text-xs text-white/40">
              Tipo de cambio implícito:{" "}
              {(from?.currency === "ARS"
                ? Number(form.amount) / Number(form.amountReceived)
                : Number(form.amountReceived) / Number(form.amount)
              ).toLocaleString("es-AR", { maximumFractionDigits: 2 })}{" "}
              ARS/USD
            </p>
          )}

          <div className="flex gap-3">
            <Field label="Fecha *">
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Descripción">
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Opcional"
              className={inputClass}
            />
          </Field>
        </>
      )}
    </FormModal>
  );
}

function initialForm(accounts: Account[]): Form {
  return {
    fromAccountId: accounts[0]?.id ?? "",
    toAccountId: accounts[1]?.id ?? "",
    amount: "",
    amountReceived: "",
    date: todayKey(),
    description: "",
  };
}
