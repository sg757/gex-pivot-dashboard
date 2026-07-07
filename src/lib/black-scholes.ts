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

/** Minimum T to avoid divide-by-zero on 0DTE (≈ 1 hour) */
export const MIN_TIME_YEARS = 1 / (365 * 24);

export function yearsToExpiration(expirationUnix: number, nowUnix = Date.now() / 1000): number {
  const seconds = expirationUnix - nowUnix;
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