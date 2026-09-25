export type CurrencyCode = "ARS" | "USD";

export function formatAmount(amount: string | number, currency: CurrencyCode = "ARS") {
  return new Intl.NumberFormat(currency === "ARS" ? "es-AR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "ARS" ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(iso: string | Date) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function lastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    };
  });
}
