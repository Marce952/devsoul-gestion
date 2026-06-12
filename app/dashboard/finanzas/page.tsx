"use client";

import { useState, useEffect, useCallback } from "react";
import { Chip } from "@heroui/react/chip";
import { Input } from "@heroui/react/input";
import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react";
import { Plus, Wallet, TrendingUp, TrendingDown } from "lucide-react";

type TransactionRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: string;
  currency: "ARS" | "USD";
  description: string | null;
  date: string;
};

type ApiResponse = {
  data: TransactionRow[];
  total: number;
  page: number;
  totalPages: number;
  summary: { income: number; expense: number; net: number };
};

type FormState = {
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: string;
  currency: "ARS" | "USD";
  description: string;
  date: string;
};

const CATEGORIES = [
  "Sueldos",
  "Infraestructura",
  "Impuestos",
  "Servicios",
  "Marketing",
  "Cobranza",
  "Otros",
];

const EMPTY_FORM: FormState = {
  type: "EXPENSE",
  category: CATEGORIES[0],
  amount: "",
  currency: "ARS",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

function formatAmount(amount: string | number, currency: "ARS" | "USD") {
  return new Intl.NumberFormat(currency === "ARS" ? "es-AR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "ARS" ? 0 : 2,
  }).format(Number(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getLast12Months() {
  const result: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    result.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return result;
}

const MONTH_OPTIONS = getLast12Months();

const selectClass =
  "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-acento-lima/50 transition-colors appearance-none";

export default function FinanzasPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });

  const [typeFilter, setTypeFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (monthFilter) params.set("month", monthFilter);
      params.set("page", String(p));
      params.set("limit", "20");
      return `/api/transactions?${params.toString()}`;
    },
    [typeFilter, monthFilter]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl(1));
      const json: ApiResponse = await res.json();
      setTransactions(Array.isArray(json.data) ? json.data : []);
      setTotal(json.total ?? 0);
      setPage(1);
      setTotalPages(json.totalPages ?? 1);
      setSummary(json.summary ?? { income: 0, expense: 0, net: 0 });
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(nextPage));
      const json: ApiResponse = await res.json();
      setTransactions((prev) => [...prev, ...(Array.isArray(json.data) ? json.data : [])]);
      setPage(nextPage);
      setTotalPages(json.totalPages ?? 1);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || Number(form.amount) <= 0 || !form.date) {
      setFormError("Completá todos los campos obligatorios con valores válidos.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          category: form.category,
          amount: Number(form.amount),
          currency: form.currency,
          description: form.description || undefined,
          date: form.date,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? "Error al guardar.");
        return;
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = [
    {
      label: "Ingresos",
      value: summary.income,
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: "Egresos",
      value: summary.expense,
      icon: TrendingDown,
      color: "text-red-400",
    },
    {
      label: "Neto",
      value: summary.net,
      icon: Wallet,
      color: summary.net >= 0 ? "text-acento-lima" : "text-red-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="glass rounded-xl p-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Finanzas</h1>
        <Button
          onPress={openCreate}
          className="bg-acento-lima text-black font-medium text-sm px-4 rounded-lg flex-shrink-0"
        >
          <Plus size={15} />
          <span className="ml-1">Nuevo Movimiento</span>
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
            <Icon size={20} className={color} />
            <div>
              <p className="text-xs text-white/40">{label}</p>
              <p className={`text-lg font-semibold ${color}`}>
                {formatAmount(value, "ARS")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-white/50 mb-1 block">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`${selectClass} w-full`}
          >
            <option value="" className="bg-black">Todos</option>
            <option value="INCOME" className="bg-black">Ingresos</option>
            <option value="EXPENSE" className="bg-black">Egresos</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-white/50 mb-1 block">Mes</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className={`${selectClass} w-full`}
          >
            <option value="" className="bg-black">Todos los meses</option>
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-black">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Wallet size={32} className="text-white/20" />
          <p className="text-white/40 text-sm">No hay movimientos con esos filtros</p>
          <button onClick={openCreate} className="text-acento-lima text-sm hover:underline">
            Registrar el primero
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {t.type === "INCOME" ? (
                    <TrendingUp size={16} className="text-green-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown size={16} className="text-red-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{t.category}</p>
                      <Chip
                        color={t.type === "INCOME" ? "success" : "danger"}
                        size="sm"
                        variant="soft"
                      >
                        {t.type === "INCOME" ? "Ingreso" : "Egreso"}
                      </Chip>
                    </div>
                    <p className="text-xs text-white/40 truncate">
                      {formatDate(t.date)}
                      {t.description ? ` · ${t.description}` : ""}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm font-semibold flex-shrink-0 ${
                    t.type === "INCOME" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatAmount(t.amount, t.currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Cargar más */}
          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm text-white/50 hover:text-white border border-white/10 rounded-lg px-5 py-2 hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                {loadingMore ? "Cargando..." : "Cargar más"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de registro */}
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header className="px-6 pt-6 pb-0">
                <Modal.Heading className="text-lg font-semibold text-white">
                  Nuevo Movimiento
                </Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleSave}>
                <Modal.Body className="px-6 py-4 space-y-3">
                  {formError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {formError}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-white/50 mb-1 block">Tipo *</label>
                      <select
                        value={form.type}
                        onChange={(e) => setField("type", e.target.value as "INCOME" | "EXPENSE")}
                        className={`${selectClass} w-full`}
                      >
                        <option value="EXPENSE" className="bg-black">Egreso</option>
                        <option value="INCOME" className="bg-black">Ingreso</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-white/50 mb-1 block">Categoría *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setField("category", e.target.value)}
                        className={`${selectClass} w-full`}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="bg-black">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-white/50 mb-1 block">Monto *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40 pointer-events-none">
                          $
                        </span>
                        <Input
                          type="number"
                          value={form.amount}
                          onChange={(e) => setField("amount", e.target.value)}
                          placeholder="0"
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-acento-lima/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-white/50 mb-1 block">Moneda</label>
                      <select
                        value={form.currency}
                        onChange={(e) => setField("currency", e.target.value as "ARS" | "USD")}
                        className={`${selectClass} w-full`}
                      >
                        <option value="ARS" className="bg-black">ARS</option>
                        <option value="USD" className="bg-black">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Fecha *</label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setField("date", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-acento-lima/50 transition-colors [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      rows={2}
                      placeholder="Detalle del movimiento..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-acento-lima/50 transition-colors resize-none"
                    />
                  </div>
                </Modal.Body>
                <Modal.Footer className="px-6 pb-6 pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="text-sm text-white/50 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <Button
                    type="submit"
                    isDisabled={saving}
                    className="bg-acento-lima text-black text-sm font-medium px-5 rounded-lg"
                  >
                    {saving ? "Guardando..." : "Registrar"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
