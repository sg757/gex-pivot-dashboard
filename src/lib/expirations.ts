import type { BullflowExpiration } from "./types";

/** Bullflow YYYYMMDD → same key in US/Eastern */
export function bullflowExpiryToEtKey(expiration: string): string {
  return expiration;
}

/** Yahoo unix expiry → Bullflow-style YYYYMMDD in Eastern time */
export function yahooExpiryToBullflowKey(unixTs: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(unixTs * 1000));

  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}${m}${d}`;
}

export function formatExpirationLabel(expiration: string, nearestDte?: string): string {
  const y = expiration.slice(0, 4);
  const m = expiration.slice(4, 6);
  const d = expiration.slice(6, 8);
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (expiration === nearestDte) return `${label} (0DTE)`;
  return label;
}

/** Nearest expiration on or after today (Eastern) for 0DTE badge */
export function nearestDteExpiration(expirations: BullflowExpiration[]): string | undefined {
  const todayKey = yahooExpiryToBullflowKey(Math.floor(Date.now() / 1000));
  const sorted = [...expirations].sort((a, b) => a.expiration.localeCompare(b.expiration));
  return sorted.find((e) => e.expiration >= todayKey)?.expiration ?? sorted[0]?.expiration;
}

export function sortExpirations(expirations: BullflowExpiration[]): BullflowExpiration[] {
  return [...expirations].sort((a, b) => a.expiration.localeCompare(b.expiration));
}