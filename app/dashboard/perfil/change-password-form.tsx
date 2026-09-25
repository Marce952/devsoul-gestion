"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/app/actions/auth";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-acento-lima/50 transition-colors";

const FIELDS = [
  { name: "current", label: "Contraseña actual", autoComplete: "current-password" },
  { name: "next", label: "Nueva contraseña (mín. 8 caracteres)", autoComplete: "new-password" },
  { name: "confirm", label: "Repetir nueva contraseña", autoComplete: "new-password" },
];

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {state?.error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-xs text-acento-lima bg-acento-lima/10 border border-acento-lima/20 rounded-lg px-3 py-2">
          {state.success}
        </p>
      )}
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="text-xs text-white/50 mb-1 block">
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type="password"
            autoComplete={f.autoComplete}
            required
            className={inputClass}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="bg-acento-lima text-black text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
