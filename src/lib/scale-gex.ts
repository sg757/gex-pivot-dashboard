import type { BullflowGEXResponse } from "./types";

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Approximate per-expiration strike GEX by scaling Bullflow's all-expiration
 * profile using that expiration's call/put totals from the expirations array.
 */
export function scaleBullflowGEXByExpiration(
  gex: BullflowGEXResponse,
  expiration: string,
): BullflowGEXResponse | null {
  const meta = gex.expirations.find((e) => e.expiration === expiration);
  if (!meta) return null;

  const totalCall = gex.expirations.reduce((sum, e) => sum + e.call_gex, 0);
  const totalPut = gex.expirations.reduce((sum, e) => sum + e.put_gex, 0);
  if (totalCall === 0 && totalPut === 0) return null;

  const scaleCall = totalCall !== 0 ? meta.call_gex / totalCall : 0;
  const scalePut = totalPut !== 0 ? meta.put_gex / totalPut : 0;

  const strikes = gex.strikes.map((s) => {
    const call_gex = round(s.call_gex * scaleCall);
    const put_gex = round(s.put_gex * scalePut);
    return {
      strike: s.strike,
      call_gex,
      put_gex,
      net_gex: round(call_gex + put_gex),
    };
  });

  return { strikes, expirations: gex.expirations };
}

export function hasActiveGEXStrikes(gex: BullflowGEXResponse): boolean {
  return gex.strikes.some(
    (s) => s.net_gex !== 0 || s.call_gex !== 0 || s.put_gex !== 0,
  );
}