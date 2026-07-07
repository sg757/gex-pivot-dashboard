import type { Quote } from "./types";
import { resolveSymbol } from "./symbols";

export async function fetchQuote(symbol: string): Promise<Quote> {
  const resolved = resolveSymbol(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(resolved.yahoo)}?interval=1d&range=10d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Yahoo quote request failed: ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No quote data for ${resolved.display} (Yahoo: ${resolved.yahoo})`);
  }

  const { meta, timestamp, indicators } = result;
  const quotes = indicators?.quote?.[0];
  if (!quotes || !Array.isArray(timestamp) || timestamp.length === 0) {
    throw new Error(`Incomplete quote data for ${resolved.display}`);
  }

  const price = meta.regularMarketPrice;

  let idx = timestamp.length - 1;
  const todayKey = new Date().toISOString().slice(0, 10);
  const lastDayKey = new Date(timestamp[idx] * 1000).toISOString().slice(0, 10);
  if (lastDayKey === todayKey && timestamp.length > 1) idx -= 1;

  for (let i = idx; i >= 0; i--) {
    if (
      typeof quotes.high[i] === "number" &&
      typeof quotes.low[i] === "number" &&
      typeof quotes.close[i] === "number"
    ) {
      return {
        symbol: resolved.display,
        price,
        previousSession: {
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          open: quotes.open[i],
        },
      };
    }
  }

  throw new Error("Could not determine previous session OHLC");
}