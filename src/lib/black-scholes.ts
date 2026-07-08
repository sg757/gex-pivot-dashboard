/** Standard normal PDF */
function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Black-Scholes gamma per share (same for calls and puts).
 * @param spot underlying price
 * @param strike option strike
 * @param timeYears time to expiration in years
 * @param volatility annualized IV (decimal, e.g. 0.20 = 20%)
 */
export function blackScholesGamma(
  spot: number,
  strike: number,
  timeYears: number,
  volatility: number,
): number {
  if (spot <= 0 || strike <= 0 || timeYears <= 0 || volatility <= 0) return 0;

  const sigmaSqrtT = volatility * Math.sqrt(timeYears);
  const d1 =
    (Math.log(spot / strike) + 0.5 * volatility * volatility * timeYears) /
    sigmaSqrtT;

  return pdf(d1) / (spot * sigmaSqrtT);
}

import { yahooExpiryToBullflowKey } from "./expirations";

/** Minimum T to avoid divide-by-zero on 0DTE (≈ 1 hour) */
export const MIN_TIME_YEARS = 1 / (365 * 24);

/** 4:00 PM America/New_York on YYYYMMDD → unix seconds */
export function easternOptionCloseUnix(yyyymmdd: string): number {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));

  const noonUtcMs = Date.UTC(y, m - 1, d, 12, 0, 0);
  const etHourAtNoonUtc = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(noonUtcMs),
  );
  const utcOffsetHours = 12 - etHourAtNoonUtc;
  const closeUtcHour = 16 + utcOffsetHours;

  return Date.UTC(y, m - 1, d, closeUtcHour, 0, 0) / 1000;
}

export function yearsToExpiration(
  expirationUnix: number,
  expirationKey?: string,
  nowUnix = Date.now() / 1000,
): number {
  const key = expirationKey ?? yahooExpiryToBullflowKey(expirationUnix);
  const closeUnix = easternOptionCloseUnix(key);
  const seconds = closeUnix - nowUnix;
  if (seconds <= 0) return 0;
  return Math.max(seconds / (365.25 * 24 * 3600), MIN_TIME_YEARS);
}

/** Normalize Yahoo IV (decimal) with sane floor/cap */
export function normalizeIv(raw: number | undefined | null): number {
  if (!raw || !Number.isFinite(raw) || raw <= 0) return 0.25;
  // Yahoo returns decimal IV (0.17 = 17%)
  if (raw > 3) return raw / 100;
  return Math.min(Math.max(raw, 0.05), 3);
}