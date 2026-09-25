export const BUSINESS_TZ = "America/Argentina/Buenos_Aires";
const DAY_MS = 86_400_000;

export function businessDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function currentPeriod(date: Date = new Date()) {
  return businessDateKey(date).slice(0, 7);
}

export function isValidPeriod(period: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

export function periodBounds(period: string) {
  const [y, m] = period.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

export function periodDueDate(period: string, day: number) {
  const [y, m] = period.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1, Math.min(Math.max(day, 1), lastDay)));
}

export function daysBetween(fromKey: string, toKey: string) {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / DAY_MS);
}

export function dueDateKey(dueDate: Date) {
  return dueDate.toISOString().slice(0, 10);
}
