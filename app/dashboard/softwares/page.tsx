"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@heroui/react/card";
import { Modal } from "@heroui/react";
import { Input } from "@heroui/react/input";
import { Button } from "@heroui/react/button";
import { Layers, Code2, Pencil, Plus, Package } from "lucide-react";

type SoftwareRow = {
  id: string;
  name: string;
  description: string | null;
  type: "SAAS" | "CUSTOM";
  basePrice: string;
  _count: { contracts: number };
};

type FormState = {
  name: string;
  description: string;
  type: "SAAS" | "CUSTOM";
  basePrice: string;
};

const TABS = [
  { key: "all", label: "Todos" },
  { key: "SAAS", label: "Modelos SaaS" },
  { key: "CUSTOM", label: "Desarrollos a Medida" },
] as const;

const EMPTY_FORM: FormState = { name: "", description: "", type: "SAAS", basePrice: "" };

const formatARS = (value: string | number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(value));

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1 block">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-acento-lima/50 transition-colors"
      />
    </div>
  );
}

export default function SoftwaresPage() {
  const [softwares, setSoftwares] = useState<SoftwareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "SAAS" | "CUSTOM">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SoftwareRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/softwares");
      const data = await res.json();
      setSoftwares(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (tab === "all" ? softwares : softwares.filter((s) => s.type === tab)),
    [softwares, tab]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (s: SoftwareRow) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      type: s.type,
      basePrice: s.basePrice,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.basePrice || Number(form.basePrice) <= 0) {
      setFormError("Completá todos los campos obligatorios con valores válidos.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editing ? `/api/softwares/${editing.id}` : "/api/softwares";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          type: form.type,
          basePrice: Number(form.basePrice),
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

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Catálogo de Software</h1>
        <Button
          onPress={openCreate}
          className="bg-acento-lima text-black font-medium text-sm px-4 rounded-lg flex-shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span className="ml-1">Registrar Software</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "bg-acento-lima/10 text-acento-lima border border-acento-lima/30 rounded-lg px-3 py-1.5 text-sm"
                : "text-white/50 hover:text-white px-3 py-1.5 text-sm rounded-lg transition-colors"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Package size={32} className="text-white/20" />
          <p className="text-white/40 text-sm">
            {tab !== "all" ? "No hay softwares de ese tipo" : "Todavía no hay softwares registrados"}
          </p>
          {tab === "all" && (
            <button onClick={openCreate} className="text-acento-lima text-sm hover:underline">
              Registrar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card.Root key={s.id} className="glass rounded-xl border-white/10">
              <Card.Header className="px-5 pt-5 pb-0 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {s.type === "SAAS" ? (
                    <Layers size={16} className="text-acento-lima/70 flex-shrink-0" />
                  ) : (
                    <Code2 size={16} className="text-acento-lima/70 flex-shrink-0" />
                  )}
                  <Card.Title className="text-base font-semibold text-white leading-tight truncate">
                    {s.name}
                  </Card.Title>
                </div>
                <span className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 flex-shrink-0">
                  {s.type === "SAAS" ? "SaaS" : "A medida"}
                </span>
              </Card.Header>
              <Card.Content className="px-5 py-3 space-y-2">
                {s.description ? (
                  <p className="text-sm text-white/60 line-clamp-2">{s.description}</p>
                ) : (
                  <p className="text-sm text-white/25 italic">Sin descripción</p>
                )}
                <p className="text-base font-semibold text-white">{formatARS(s.basePrice)}</p>
              </Card.Content>
              <Card.Footer className="px-5 pb-4 pt-0 flex items-center justify-between">
                <button
                  onClick={() => openEdit(s)}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                >
                  <Pencil size={13} />
                  Editar
                </button>
                <span className="text-xs text-acento-lima/80">
                  {s._count.contracts} contrato{s._count.contracts !== 1 ? "s" : ""}
                </span>
              </Card.Footer>
            </Card.Root>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header className="px-6 pt-6 pb-0">
                <Modal.Heading className="text-lg font-semibold text-white">
                  {editing ? "Editar Software" : "Registrar Software"}
                </Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleSave}>
              <Modal.Body className="px-6 py-4 space-y-3">
                {formError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}
                <InputField
                  label="Nombre *"
                  value={form.name}
                  onChange={(v) => setField("name", v)}
                />
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-acento-lima/50 transition-colors resize-none"
                    placeholder="Descripción del software..."
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value as "SAAS" | "CUSTOM")}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-acento-lima/50 transition-colors appearance-none"
                  >
                    <option value="SAAS" className="bg-black">SaaS</option>
                    <option value="CUSTOM" className="bg-black">Desarrollo a Medida</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Precio Base * (ARS)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40 pointer-events-none">
                      $
                    </span>
                    <Input
                      type="number"
                      value={form.basePrice}
                      onChange={(e) => setField("basePrice", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-acento-lima/50 transition-colors"
                      placeholder="0"
                    />
                  </div>
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
                  {saving ? "Guardando..." : "Guardar"}
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
