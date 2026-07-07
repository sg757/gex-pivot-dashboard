const BULLFLOW_GEX_URL = "https://api.bullflow.io/v1/gex";

/**
 * @typedef {Object} BullflowStrike
 * @property {number} strike
 * @property {number} call_gex
 * @property {number} put_gex
 * @property {number} net_gex
 */

/**
 * @typedef {Object} BullflowExpiration
 * @property {string} expiration
 * @property {number} call_gex
 * @property {number} put_gex
 * @property {number} net_gex
 */

/**
 * @typedef {Object} BullflowGEXResponse
 * @property {BullflowStrike[]} strikes
 * @property {BullflowExpiration[]} expirations
 */

/**
 * @param {string} ticker
 * @param {{ apiKey?: string }} [options]
 * @returns {Promise<BullflowGEXResponse>}
 */
export async function fetchBullflowGEX(ticker, options = {}) {
  const params = new URLSearchParams({ ticker: ticker.toUpperCase() });
  const headers = { Accept: "application/json" };
  if (options.apiKey) {
    headers["X-Api-Key"] = options.apiKey;
  }

  const res = await fetch(`${BULLFLOW_GEX_URL}?${params}`, { headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? `Bullflow API error: ${res.status}`);
  }
  if (!Array.isArray(data.strikes)) {
    throw new Error("Invalid Bullflow response: missing strikes array");
  }

  return data;
}

/**
 * Load GEX data from a saved Bullflow JSON file.
 * @param {string} filePath
 * @returns {Promise<BullflowGEXResponse>}
 */
export async function loadGEXFromFile(filePath) {
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.strikes)) {
    throw new Error("Invalid file: expected { strikes: [...] }");
  }
  return data;
}