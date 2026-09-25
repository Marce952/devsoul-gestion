"use client";

import { useState } from "react";
import { Field, FormModal, postJson } from "@/components/form-modal";
import { formatAmount, todayKey, type CurrencyCode } from "@/lib/format";
import { inputClass, selectClass, type Account } from "../finanzas/types";

export type PayableInvoice = {
  id: string;
  amount: string;
  currency: CurrencyCode;
  period: string;
  clientName: string;
};

type Props = {
  invoice: PayableInvoice | null;
  accounts: Account[];
  onClose: () => void;
  onPaid: () => void;
};

export function PayInvoiceModal({ invoice, accounts, onClose, onPaid }: Props) {
  const [accountId, setAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayKey());
  const [amountReceived, setAmountReceived] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  if ((invoice?.id ?? null) !== current) {
    setCurrent(invoice?.id ?? null);
    if (invoice) {
      setAccountId((accounts.find((a) => a.currency === invoice.currency) ?? accounts[0])?.id ?? "");
      setPaymentDate(todayKey());
      setAmountReceived("");
      setError(null);
    }
  }

  const account = accounts.find((a) => a.id === accountId);
  const crossCurrency = Boolean(invoice && account && account.currency !== invoice.currency);

  const submit = async () => {
    if (!invoice || !account) return setError("Elegí la cuenta donde ingresó el cobro.");
    if (crossCurrency && !(Number(amountReceived) > 0)) {
      return setError(`Indicá el monto recibido en ${account.currency}.`);
    }
    setSaving(true);
    setError(null);
    const err = await postJson(
      `/api/invoices/${invoice.id}`,
      {
        accountId,
        paymentDate,
        amountReceived: crossCurrency ? Number(amountReceived) : undefined,
      },
      "PATCH"
    );
    setSaving(false);
    if (err) return setError(err);
    onPaid();
    onClose();
  };

  return (
    <FormModal
      isOpen={Boolean(invoice)}
      onOpenChange={(open) => !open && onClose()}
      title="Registrar cobro"
      error={error}
      saving={saving}
      submitLabel="Marcar cobrada"
      onSubmit={submit}
    >
      {invoice && (
        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
          <p className="text-sm text-white">{invoice.clientName}</p>
          <p className="text-xs text-white/50">
            Período {invoice.period} · {formatAmount(invoice.amount, invoice.currency)}
          </p>
        </div>
      )}
      {accounts.length === 0 ? (
        <p className="text-sm text-white/50">Primero creá una cuenta en Finanzas → Configuración.</p>
      ) : (
        <>
          <div className="flex gap-3">
            <Field label="Cuenta destino *">
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectClass}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-black">
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de cobro *">
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputClass} />
            </Field>
          </div>
          {crossCurrency && (
            <Field label={`Monto recibido * (${account?.currency})`}>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
        </>
      )}
    </FormModal>
  );
}
