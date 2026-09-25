"use client";

import { useState } from "react";
import { Field, FormModal, postJson } from "@/components/form-modal";
import { todayKey } from "@/lib/format";
import { inputClass, selectClass, type Account, type Category } from "./types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  onSaved: () => void;
};

type Form = {
  type: "INCOME" | "EXPENSE";
  accountId: string;
  categoryId: string;
  amount: string;
  date: string;
  description: string;
};

export function MovementModal({ isOpen, onOpenChange, accounts, categories, onSaved }: Props) {
  const [form, setForm] = useState<Form>(() => initialForm(accounts, categories));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setForm(initialForm(accounts, categories));
      setError(null);
    }
  }

  const typeCategories = categories.filter((c) => c.type === form.type);
  const account = accounts.find((a) => a.id === form.accountId);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const changeType = (type: Form["type"]) =>
    setForm((f) => ({ ...f, type, categoryId: categories.find((c) => c.type === type)?.id ?? "" }));

  const submit = async () => {
    if (!form.accountId || !form.categoryId || !(Number(form.amount) > 0) || !form.date) {
      setError("Completá todos los campos obligatorios con valores válidos.");
      return;
    }
    setSaving(true);
    setError(null);
    const err = await postJson("/api/transactions", {
      ...form,
      amount: Number(form.amount),
      description: form.description || undefined,
    });
    setSaving(false);
    if (err) return setError(err);
    onOpenChange(false);
    onSaved();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Nuevo movimiento"
      error={error}
      saving={saving}
      submitLabel="Registrar"
      onSubmit={submit}
    >
      <div className="grid grid-cols-2 gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => changeType(t)}
            className={`rounded-lg py-2 text-sm border transition-colors ${
              form.type === t
                ? t === "INCOME"
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {t === "INCOME" ? "Ingreso" : "Egreso"}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Field label="Cuenta *">
          <select value={form.accountId} onChange={(e) => set("accountId", e.target.value)} className={selectClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-black">
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría *">
          <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={selectClass}>
            {typeCategories.map((c) => (
              <option key={c.id} value={c.id} className="bg-black">
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex gap-3">
        <Field label={`Monto * ${account ? `(${account.currency})` : ""}`}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </Field>
        <Field label="Fecha *">
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Descripción">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="Detalle del movimiento..."
          className={`${inputClass} resize-none`}
        />
      </Field>
    </FormModal>
  );
}

function initialForm(accounts: Account[], categories: Category[]): Form {
  return {
    type: "EXPENSE",
    accountId: accounts[0]?.id ?? "",
    categoryId: categories.find((c) => c.type === "EXPENSE")?.id ?? "",
    amount: "",
    date: todayKey(),
    description: "",
  };
}
