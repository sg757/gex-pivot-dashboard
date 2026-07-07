/**
 * @typedef {import('./gex-analysis.mjs').GEXLevel} GEXLevel
 * @typedef {import('./pivots.mjs').PivotLevel} PivotLevel
 */

/**
 * @typedef {Object} OptimalPivot
 * @property {number} price
 * @property {number} score
 * @property {'support' | 'resistance' | 'pivot' | 'regime_boundary'} role
 * @property {string[]} sources
 * @property {string} recommendation
 */

const GEX_WEIGHTS = {
  gamma_flip: 10,
  call_wall: 9,
  put_wall: 9,
  max_positive_gex: 8,
  max_negative_gex: 8,
  gex_magnet_positive: 6,
  gex_magnet_negative: 6,
};

const PIVOT_WEIGHTS = {
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

/**
 * @param {GEXLevel[]} gexLevels
 * @param {PivotLevel[]} traditionalPivots
 * @param {number} spotPrice
 * @param {{ tolerancePct?: number }} [options]
 * @returns {OptimalPivot[]}
 */
export function findOptimalPivots(gexLevels, traditionalPivots, spotPrice, options = {}) {
  const tolerancePct = options.tolerancePct ?? 0.0025;
  const tolerance = Math.max(spotPrice * tolerancePct, 0.5);

  /** @type {{ price: number, score: number, role: string, sources: string[] }[]} */
  const rawPoints = [];

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

  /** @type {{ price: number, score: number, roles: Set<string>, sources: string[] }[]} */
  const clusters = [];

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

  const confluenceBonus = (count) => (count >= 3 ? 8 : count === 2 ? 4 : 0);

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

/**
 * @param {Set<string>} roles
 * @param {number} price
 * @param {number} spot
 * @returns {'support' | 'resistance' | 'pivot' | 'regime_boundary'}
 */
function resolveRole(roles, price, spot) {
  if (roles.has("regime_boundary")) return "regime_boundary";
  if (roles.has("pivot")) return "pivot";
  if (price > spot) return "resistance";
  if (price < spot) return "support";
  return "pivot";
}

/**
 * @param {'support' | 'resistance' | 'pivot' | 'regime_boundary'} role
 * @param {number} price
 * @param {number} spot
 * @param {string[]} sources
 */
function buildRecommendation(role, price, spot, sources) {
  const dist = Math.abs(price - spot);
  const distPct = ((dist / spot) * 100).toFixed(1);
  const hasGex = sources.some((s) => s.startsWith("gex:"));
  const hasTraditional = sources.some((s) => !s.startsWith("gex:"));

  if (role === "regime_boundary") {
    return `Critical gamma flip — trade regime changes above/below this level (${distPct}% from spot)`;
  }
  if (role === "support") {
    const basis = hasGex && hasTraditional ? "GEX + traditional confluence" : hasGex ? "dealer hedging floor" : "classic pivot support";
    return `Support at ${price.toFixed(2)} (${basis}, ${distPct}% below spot)`;
  }
  if (role === "resistance") {
    const basis = hasGex && hasTraditional ? "GEX + traditional confluence" : hasGex ? "dealer hedging ceiling" : "classic pivot resistance";
    return `Resistance at ${price.toFixed(2)} (${basis}, ${distPct}% above spot)`;
  }
  return `Key pivot zone at ${price.toFixed(2)} (${sources.length} confirming signals)`;
}

/**
 * @param {OptimalPivot[]} pivots
 * @param {number} spot
 */
export function summarizeTradePlan(pivots, spot, gammaRegime) {
  const above = pivots.filter((p) => p.price > spot).sort((a, b) => a.price - b.price);
  const below = pivots.filter((p) => p.price < spot).sort((a, b) => b.price - a.price);
  const nearestResistance = above[0] ?? null;
  const nearestSupport = below[0] ?? null;
  const topPivot = pivots[0] ?? null;

  return {
    gammaRegime,
    spot,
    primaryPivot: topPivot,
    nearestSupport,
    nearestResistance,
    bullishTrigger: nearestResistance?.price ?? null,
    bearishTrigger: nearestSupport?.price ?? null,
    strategy:
      gammaRegime === "positive"
        ? "Positive gamma: fade extremes between put/call walls; mean-reversion favored"
        : "Negative gamma: respect momentum; breaks accelerate — use wider stops",
  };
}