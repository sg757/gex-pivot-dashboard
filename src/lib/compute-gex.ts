import {
  blackScholesGamma,
  normalizeIv,
  yearsToExpiration,
} from "./black-scholes";
import type { BullflowGEXResponse, BullflowStrike } from "./types";

interface OptionContract {
  strike: number;
  openInterest?: number;
  impliedVolatility?: number;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build per-strike GEX from an options chain using Black-Scholes gamma.
 * GEX = gamma × OI × 100 × spot²  (matches Bullflow magnitude)
 */
export function computeGEXFromOptions(
  calls: OptionContract[],
  puts: OptionContract[],
  spotPrice: number,
  expirationUnix: number,
  expirationKey: string,
  expirations: BullflowGEXResponse["expirations"],
): BullflowGEXResponse {
  // Standard dollar GEX: Γ × OI × 100 × S² × 0.01 = Γ × OI × S²
  const scale = spotPrice * spotPrice;
  const strikeMap = new Map<number, BullflowStrike>();

  const getOrCreate = (strike: number): BullflowStrike => {
    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, { strike, call_gex: 0, put_gex: 0, net_gex: 0 });
    }
    return strikeMap.get(strike)!;
  };

  const timeYears = yearsToExpiration(expirationUnix, expirationKey);

  for (const c of calls) {
    const oi = c.openInterest ?? 0;
    if (oi <= 0) continue;
    const gamma = blackScholesGamma(
      spotPrice,
      c.strike,
      timeYears,
      normalizeIv(c.impliedVolatility),
    );
    const row = getOrCreate(c.strike);
    row.call_gex += gamma * oi * scale;
  }

  for (const p of puts) {
    const oi = p.openInterest ?? 0;
    if (oi <= 0) continue;
    const gamma = blackScholesGamma(
      spotPrice,
      p.strike,
      timeYears,
      normalizeIv(p.impliedVolatility),
    );
    const row = getOrCreate(p.strike);
    row.put_gex -= gamma * oi * scale;
  }

  const strikes = Array.from(strikeMap.values())
    .map((s) => ({
      ...s,
      call_gex: round(s.call_gex),
      put_gex: round(s.put_gex),
      net_gex: round(s.call_gex + s.put_gex),
    }))
    .sort((a, b) => a.strike - b.strike);

  return { strikes, expirations };
}