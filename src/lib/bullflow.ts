import type { BullflowGEXResponse } from "./types";

const BULLFLOW_GEX_URL = "https://api.bullflow.io/v1/gex";

export async function fetchBullflowGEX(
  ticker: string,
  apiKey?: string,
): Promise<BullflowGEXResponse> {
  const params = new URLSearchParams({ ticker: ticker.toUpperCase() });
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const res = await fetch(`${BULLFLOW_GEX_URL}?${params}`, {
    headers,
    cache: "no-store",
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : data?.error?.message ?? `Bullflow API error: ${res.status}`,
    );
  }
  if (!Array.isArray(data.strikes)) {
    throw new Error("Invalid Bullflow response: missing strikes array");
  }

  return data;
}