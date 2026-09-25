import "server-only";
import { Currency, Prisma, RateSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const RATE_CASA = process.env.EXCHANGE_RATE_CASA ?? "oficial";
const LOOKBACK_DAYS = 7;
const FETCH_TIMEOUT_MS = 5000;

export class RateUnavailableError extends Error {
  constructor(currency: Currency, date: Date) {
    super(
      `No hay cotización de ${currency} para el ${toDateKey(date)}. Cargala manualmente en Finanzas → Configuración.`
    );
  }
}

export type RateResult = { rate: number; source: RateSource | "BASE"; date: string };

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateOnly(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function readVenta(data: unknown): number | null {
  if (data && typeof data === "object" && "venta" in data) {
    const venta = Number((data as { venta: unknown }).venta);
    return Number.isFinite(venta) && venta > 0 ? venta : null;
  }
  return null;
}

async function fetchUsdRate(key: string): Promise<number | null | "offline"> {
  try {
    if (key === toDateKey(new Date())) {
      const today = readVenta(await fetchJson(`https://dolarapi.com/v1/dolares/${RATE_CASA}`));
      if (today) return today;
    }
    const [y, m, d] = key.split("-");
    return readVenta(
      await fetchJson(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${RATE_CASA}/${y}/${m}/${d}`)
    );
  } catch {
    return "offline";
  }
}

export async function getRateToArs(currency: Currency, date: Date = new Date()): Promise<RateResult> {
  const key = toDateKey(date);
  if (currency === Currency.ARS) return { rate: 1, source: "BASE", date: key };

  const stored = await prisma.exchangeRate.findUnique({
    where: { currency_date: { currency, date: dateOnly(key) } },
  });
  if (stored) return { rate: Number(stored.rateToArs), source: stored.source, date: key };

  if (date <= new Date()) {
    for (let i = 0; i <= LOOKBACK_DAYS; i++) {
      const lookup = new Date(dateOnly(key).getTime() - i * 86_400_000);
      const rate = await fetchUsdRate(toDateKey(lookup));
      if (rate === "offline") break;
      if (rate) {
        await prisma.exchangeRate.upsert({
          where: { currency_date: { currency, date: dateOnly(key) } },
          create: { currency, date: dateOnly(key), rateToArs: rate, source: RateSource.API },
          update: {},
        });
        return { rate, source: RateSource.API, date: key };
      }
    }
  }

  const previous = await prisma.exchangeRate.findFirst({
    where: { currency, date: { lte: dateOnly(key) } },
    orderBy: { date: "desc" },
  });
  if (previous) {
    return { rate: Number(previous.rateToArs), source: previous.source, date: toDateKey(previous.date) };
  }

  throw new RateUnavailableError(currency, date);
}

export async function getCurrentRates() {
  const usd = await getRateToArs(Currency.USD).catch(() => null);
  return { [Currency.ARS]: 1, [Currency.USD]: usd?.rate ?? null } as Record<Currency, number | null>;
}

export function toArs(amount: Prisma.Decimal | number | string, rate: number) {
  return Math.round(Number(amount) * rate * 100) / 100;
}
