import type { GEXLevel, OptimalPivot, PivotLevel } from "./types";

const GEX_WEIGHTS: Record<string, number> = {
  gamma_flip: 10,
  call_wall: 9,
  put_wall: 9,
  max_positive_gex: 8,
  max_negative_gex: 8,
  gex_magnet_positive: 6,
  gex_magnet_negative: 6,
};

const PIVOT_WEIGHTS: Record<string, number> = {
  Pivot: 5,
  R1: 4,
  S1: 4,
  R2: 3,
  S2: 3,
  R3: 2,
  S3: 2,
  R4: 2,
  S4: 2,
};

export function findOptimalPivots(
  gexLevels: GEXLevel[],
  traditionalPivots: PivotLevel[],
  spotPrice: number,
  tolerancePct = 0.0025,
): OptimalPivot[] {
  const tolerance = Math.max(spotPrice * tolerancePct, 0.5);

  const rawPoints: { price: number; score: number; role: string; sources: string[] }[] = [];

  for (const level of gexLevels) {
    rawPoints.push({
      price: level.strike,
      score: GEX_WEIGHTS[level.type] ?? 5,
      role: level.role,
      sources: [`gex:${level.type}`],
    });
  }

  for (const pivot of traditionalPivots) {
    rawPoints.push({
      price: pivot.value,
      score: PIVOT_WEIGHTS[pivot.label] ?? 3,
      role: pivot.role,
      sources: [`${pivot.method}:${pivot.label}`],
    });
  }

  rawPoints.sort((a, b) => a.price - b.price);

  const clusters: {
    price: number;
    score: number;
    roles: Set<string>;
    sources: string[];
  }[] = [];

  for (const point of rawPoints) {
    const existing = clusters.find((c) => Math.abs(c.price - point.price) <= tolerance);
    if (existing) {
      const n = existing.sources.length + 1;
      existing.price = (existing.price * (n - 1) + point.price) / n;
      existing.score += point.score;
      existing.roles.add(point.role);
      existing.sources.push(...point.sources);
    } else {
      clusters.push({
        price: point.price,
        score: point.score,
        roles: new Set([point.role]),
        sources: [...point.sources],
      });
    }
  }

  const confluenceBonus = (count: number) => (count >= 3 ? 8 : count === 2 ? 4 : 0);

  return clusters
    .map((cluster) => {
      const uniqueSources = [...new Set(cluster.sources)];
      const score = cluster.score + confluenceBonus(uniqueSources.length);
      const role = resolveRole(cluster.roles, cluster.price, spotPrice);
      return {
        price: Math.round(cluster.price * 100) / 100,
        score,
        role,
        sources: uniqueSources,
        recommendation: buildRecommendation(role, cluster.price, spotPrice, uniqueSources),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function resolveRole(
  roles: Set<string>,
  price: number,
  spot: number,
): OptimalPivot["role"] {
  if (roles.has("regime_boundary")) return "regime_boundary";
  if (roles.has("pivot")) return "pivot";
  if (price > spot) return "resistance";
  if (price < spot) return "support";
  return "pivot";
}

function buildRecommendation(
  role: OptimalPivot["role"],
  price: number,
  spot: number,
  sources: string[],
): string {
  const distPct = ((Math.abs(price - spot) / spot) * 100).toFixed(1);
  const hasGex = sources.some((s) => s.startsWith("gex:"));
  const hasTraditional = sources.some((s) => !s.startsWith("gex:"));

  if (role === "regime_boundary") {
    return `Critical gamma flip — regime changes above/below (${distPct}% from spot)`;
  }
  if (role === "support") {
    const basis =
      hasGex && hasTraditional
        ? "GEX + traditional confluence"
        : hasGex
          ? "dealer hedging floor"
          : "classic pivot support";
    return `Support at ${price.toFixed(2)} (${basis}, ${distPct}% below spot)`;
  }
  if (role === "resistance") {
    const basis =
      hasGex && hasTraditional
        ? "GEX + traditional confluence"
        : hasGex
          ? "dealer hedging ceiling"
          : "classic pivot resistance";
    return `Resistance at ${price.toFixed(2)} (${basis}, ${distPct}% above spot)`;
  }
  return `Key pivot zone at ${price.toFixed(2)} (${sources.length} confirming signals)`;
}

export function summarizeTradePlan(
  pivots: OptimalPivot[],
  spot: number,
  gammaRegime: string,
) {
  const above = pivots.filter((p) => p.price > spot).sort((a, b) => a.price - b.price);
  const below = pivots.filter((p) => p.price < spot).sort((a, b) => b.price - a.price);

  return {
    gammaRegime,
    spot,
    primaryPivot: pivots[0] ?? null,
    nearestSupport: below[0] ?? null,
    nearestResistance: above[0] ?? null,
    bullishTrigger: above[0]?.price ?? null,
    bearishTrigger: below[0]?.price ?? null,
    strategy:
      gammaRegime === "positive"
        ? "Positive gamma: fade extremes between put/call walls; mean-reversion favored"
        : "Negative gamma: respect momentum; breaks accelerate — use wider stops",
  };
}