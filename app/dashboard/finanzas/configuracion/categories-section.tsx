"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { postJson } from "@/components/form-modal";
import { useJson } from "@/lib/hooks/use-json";
import { inputClass, type Category } from "../types";

const GROUPS = [
  { type: "INCOME", label: "Ingresos", color: "text-green-400" },
  { type: "EXPENSE", label: "Egresos", color: "text-red-400" },
] as const;

export function CategoriesSection() {
  const { data, reload } = useJson<Category[]>("/api/categories?all=true");
  const [drafts, setDrafts] = useState<Record<string, string>>({ INCOME: "", EXPENSE: "" });
  const [error, setError] = useState<string | null>(null);

  const create = async (type: "INCOME" | "EXPENSE") => {
    const name = drafts[type].trim();
    if (!name) return;
    const err = await postJson("/api/categories", { name, type });
    setError(err);
    if (!err) {
      setDrafts((d) => ({ ...d, [type]: "" }));
      reload();
    }
  };

  const toggle = async (c: Category) => {
    const err = await postJson(`/api/categories/${c.id}`, { active: !c.active }, "PATCH");
    setError(err);
    if (!err) reload();
  };

  return (
    <section className="glass rounded-xl p-4 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-white">Categorías</h2>
        <p className="text-xs text-white/40">Tocá una categoría para activarla o desactivarla.</p>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GROUPS.map((g) => (
          <div key={g.type} className="space-y-2">
            <h3 className={`text-sm font-medium ${g.color}`}>{g.label}</h3>
            <div className="flex flex-wrap gap-2">
              {(data ?? [])
                .filter((c) => c.type === g.type)
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggle(c)}
                    title={`${c._count.transactions} movimientos`}
                    className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                      c.active
                        ? "border-white/15 text-white/80 bg-white/5 hover:border-white/30"
                        : "border-white/5 text-white/30 line-through"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create(g.type);
              }}
              className="flex gap-2"
            >
              <input
                value={drafts[g.type]}
                onChange={(e) => setDrafts((d) => ({ ...d, [g.type]: e.target.value }))}
                placeholder="Nueva categoría"
                className={inputClass}
              />
              <button
                type="submit"
                className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-acento-lima hover:border-acento-lima/40"
                title="Agregar"
              >
                {drafts[g.type] ? <Check size={16} /> : <Plus size={16} />}
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
