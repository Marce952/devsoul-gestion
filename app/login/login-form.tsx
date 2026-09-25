"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { login } from "@/app/actions/auth";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-acento-lima/50 transition-colors";

export function LoginForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="glass rounded-2xl p-6 space-y-4">
      <input type="hidden" name="from" value={from} />
      {state?.error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="text-xs text-white/50 mb-1 block">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-xs text-white/50 mb-1 block">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-acento-lima text-black font-medium text-sm rounded-lg py-2.5 disabled:opacity-60 transition-opacity"
      >
        <LogIn size={16} />
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
