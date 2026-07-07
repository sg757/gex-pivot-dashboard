/**
 * @typedef {import('./bullflow.mjs').BullflowStrike} BullflowStrike
 * @typedef {import('./bullflow.mjs').BullflowGEXResponse} BullflowGEXResponse
 */

/**
 * @typedef {Object} GEXLevel
 * @property {string} type
 * @property {number} strike
 * @property {number} value
 * @property {string} role
 * @property {string} description
 */

/**
 * @typedef {Object} GEXAnalysis
 * @property {number} spotPrice
 * @property {number} totalNetGEX
 * @property {'positive' | 'negative'} gammaRegime
 * @property {GEXLevel[]} levels
 * @property {BullflowStrike[]} nearbyStrikes
 * @property {BullflowGEXResponse['expirations']} expirations
 */

function round(n, digits = 2) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/**
 * @param {BullflowStrike[]} strikes
 * @param {number} spot
 * @param {number} pct
 */
function filterNearSpot(strikes, spot, pct = 0.08) {
  const range = spot * pct;
  return strikes
    .filter((s) => Math.abs(s.strike - spot) <= range)
    .sort((a, b) => a.strike - b.strike);
}

/**
 * Interpolate gamma flip where net GEX crosses zero between adjacent strikes.
 * @param {BullflowStrike[]} near
 * @returns {number | null}
 */
function findGammaFlip(near) {
  let lastFlip = null;
  for (let i = 1; i < near.length; i++) {
    const a = near[i - 1];
    const b = near[i];
    if ((a.net_gex < 0 && b.net_gex >= 0) || (a.net_gex > 0 && b.net_gex <= 0)) {
      const denom = Math.abs(a.net_gex) + Math.abs(b.net_gex);
      const w = denom > 0 ? Math.abs(a.net_gex) / denom : 0.5;
      lastFlip = round(a.strike * (1 - w) + b.strike * w);
    }
  }
  return lastFlip;
}

/**
 * @param {BullflowGEXResponse} gex
 * @param {number} spotPrice
 * @param {{ rangePct?: number }} [options]
 * @returns {GEXAnalysis}
 */
export function analyzeGEX(gex, spotPrice, options = {}) {
  const rangePct = options.rangePct ?? 0.08;
  const strikes = [...gex.strikes].sort((a, b) => a.strike - b.strike);
  const active = strikes.filter((s) => s.net_gex !== 0 || s.call_gex !== 0 || s.put_gex !== 0);
  const nearby = filterNearSpot(active, spotPrice, rangePct);
  const totalNetGEX = strikes.reduce((sum, s) => sum + s.net_gex, 0);

  const gammaFlip = findGammaFlip(nearby);
  const callWall = nearby.reduce(
    (best, s) => (s.call_gex > (best?.call_gex ?? -Infinity) ? s : best),
    /** @type {BullflowStrike | null} */ (null),
  );
  const putWall = nearby.reduce(
    (best, s) => (s.put_gex < (best?.put_gex ?? Infinity) ? s : best),
    /** @type {BullflowStrike | null} */ (null),
  );
  const maxPositiveNet = nearby.reduce(
    (best, s) => (s.net_gex > (best?.net_gex ?? -Infinity) ? s : best),
    /** @type {BullflowStrike | null} */ (null),
  );
  const maxNegativeNet = nearby.reduce(
    (best, s) => (s.net_gex < (best?.net_gex ?? Infinity) ? s : best),
    /** @type {BullflowStrike | null} */ (null),
  );

  const localMagnets = [...nearby]
    .sort((a, b) => Math.abs(b.net_gex) - Math.abs(a.net_gex))
    .slice(0, 3)
    .map((s) => ({
      type: s.net_gex >= 0 ? "gex_magnet_positive" : "gex_magnet_negative",
      strike: s.strike,
      value: round(s.net_gex),
      role: s.net_gex >= 0 ? "support_pin" : "resistance_pin",
      description:
        s.net_gex >= 0
          ? "High positive net GEX — dealers dampen moves (pin/support)"
          : "High negative net GEX — dealers amplify moves (volatility zone)",
    }));

  /** @type {GEXLevel[]} */
  const levels = [];

  if (gammaFlip !== null) {
    levels.push({
      type: "gamma_flip",
      strike: gammaFlip,
      value: gammaFlip,
      role: "regime_boundary",
      description: "Zero-gamma pivot — above = stabilizing, below = volatile",
    });
  }
  if (callWall) {
    levels.push({
      type: "call_wall",
      strike: callWall.strike,
      value: round(callWall.call_gex),
      role: "resistance",
      description: "Largest call-side GEX — dealer selling creates ceiling",
    });
  }
  if (putWall) {
    levels.push({
      type: "put_wall",
      strike: putWall.strike,
      value: round(putWall.put_gex),
      role: "support",
      description: "Largest put-side GEX — dealer buying creates floor",
    });
  }
  if (maxPositiveNet) {
    levels.push({
      type: "max_positive_gex",
      strike: maxPositiveNet.strike,
      value: round(maxPositiveNet.net_gex),
      role: "bullish_magnet",
      description: "Largest positive net GEX near spot — upside pin target",
    });
  }
  if (maxNegativeNet) {
    levels.push({
      type: "max_negative_gex",
      strike: maxNegativeNet.strike,
      value: round(maxNegativeNet.net_gex),
      role: "bearish_magnet",
      description: "Largest negative net GEX near spot — downside acceleration zone",
    });
  }

  for (const magnet of localMagnets) {
    if (!levels.some((l) => l.type === magnet.type && l.strike === magnet.strike)) {
      levels.push(magnet);
    }
  }

  const gammaRegime =
    gammaFlip !== null
      ? spotPrice > gammaFlip
        ? "positive"
        : "negative"
      : totalNetGEX >= 0
        ? "positive"
        : "negative";

  return {
    spotPrice,
    totalNetGEX: round(totalNetGEX),
    gammaRegime,
    levels,
    nearbyStrikes: nearby,
    expirations: gex.expirations ?? [],
  };
}