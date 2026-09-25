"use client";

import { useCallback, useEffect, useState } from "react";

type State<T> = { key: string; data: T | null; error: string | null };

export function useJson<T>(url: string | null) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T>>({ key: "", data: null, error: null });
  const key = url ? `${url}#${version}` : "";

  useEffect(() => {
    if (!url) return;
    let active = true;
    const requestKey = `${url}#${version}`;
    fetch(url)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!active) return;
        setState(
          res.ok
            ? { key: requestKey, data: json as T, error: null }
            : { key: requestKey, data: null, error: json?.error ?? "Error al cargar datos" }
        );
      })
      .catch(() => {
        if (active) setState({ key: requestKey, data: null, error: "Error de red" });
      });
    return () => {
      active = false;
    };
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    loading: Boolean(url) && state.key !== key,
    key,
    reload,
  };
}
