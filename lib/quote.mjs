/**
 * @typedef {Object} PreviousSession
 * @property {number} high
 * @property {number} low
 * @property {number} close
 * @property {number} open
 */

/**
 * @typedef {Object} Quote
 * @property {string} symbol
 * @property {number} price
 * @property {PreviousSession} previousSession
 */

/**
 * @param {string} symbol
 * @returns {Promise<Quote>}
 */
export async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=10d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Yahoo quote request failed: ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("No chart data in Yahoo response");

  const { meta, timestamp, indicators } = result;
  const quotes = indicators.quote[0];
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
        symbol: meta.symbol,
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