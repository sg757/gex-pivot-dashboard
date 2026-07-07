/**
 * @typedef {import('./quote.mjs').PreviousSession} PreviousSession
 */

/**
 * @typedef {Object} PivotLevel
 * @property {string} method
 * @property {string} label
 * @property {number} value
 * @property {string} role
 */

function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {PreviousSession} prev
 * @returns {PivotLevel[]}
 */
export function standardPivots(prev) {
  const { high, low, close } = prev;
  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  return [
    { method: "standard", label: "R3", value: round(r3), role: "resistance" },
    { method: "standard", label: "R2", value: round(r2), role: "resistance" },
    { method: "standard", label: "R1", value: round(r1), role: "resistance" },
    { method: "standard", label: "Pivot", value: round(pivot), role: "pivot" },
    { method: "standard", label: "S1", value: round(s1), role: "support" },
    { method: "standard", label: "S2", value: round(s2), role: "support" },
    { method: "standard", label: "S3", value: round(s3), role: "support" },
  ];
}

/**
 * @param {PreviousSession} prev
 * @returns {PivotLevel[]}
 */
export function fibonacciPivots(prev) {
  const { high, low, close } = prev;
  const pivot = (high + low + close) / 3;
  const range = high - low;

  return [
    { method: "fibonacci", label: "R3", value: round(pivot + range), role: "resistance" },
    { method: "fibonacci", label: "R2", value: round(pivot + range * 0.618), role: "resistance" },
    { method: "fibonacci", label: "R1", value: round(pivot + range * 0.382), role: "resistance" },
    { method: "fibonacci", label: "Pivot", value: round(pivot), role: "pivot" },
    { method: "fibonacci", label: "S1", value: round(pivot - range * 0.382), role: "support" },
    { method: "fibonacci", label: "S2", value: round(pivot - range * 0.618), role: "support" },
    { method: "fibonacci", label: "S3", value: round(pivot - range), role: "support" },
  ];
}

/**
 * @param {PreviousSession} prev
 * @returns {PivotLevel[]}
 */
export function camarillaPivots(prev) {
  const { high, low, close } = prev;
  const range = high - low;

  return [
    { method: "camarilla", label: "R4", value: round(close + (range * 1.1) / 2), role: "resistance" },
    { method: "camarilla", label: "R3", value: round(close + (range * 1.1) / 4), role: "resistance" },
    { method: "camarilla", label: "R2", value: round(close + (range * 1.1) / 6), role: "resistance" },
    { method: "camarilla", label: "R1", value: round(close + (range * 1.1) / 12), role: "resistance" },
    { method: "camarilla", label: "S1", value: round(close - (range * 1.1) / 12), role: "support" },
    { method: "camarilla", label: "S2", value: round(close - (range * 1.1) / 6), role: "support" },
    { method: "camarilla", label: "S3", value: round(close - (range * 1.1) / 4), role: "support" },
    { method: "camarilla", label: "S4", value: round(close - (range * 1.1) / 2), role: "support" },
  ];
}

/**
 * @param {PreviousSession} prev
 * @returns {PivotLevel[]}
 */
export function allTraditionalPivots(prev) {
  return [...standardPivots(prev), ...fibonacciPivots(prev), ...camarillaPivots(prev)];
}