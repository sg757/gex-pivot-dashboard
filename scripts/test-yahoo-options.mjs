const symbols = ["SPY", "SPX", "^SPX", "^GSPC"];
for (const sym of symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(sym)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  const j = await res.json();
  const r = j?.optionChain?.result?.[0];
  const exps = r?.expirationDates?.slice(0, 3) ?? [];
  const spot = r?.quote?.regularMarketPrice;
  const calls = r?.options?.[0]?.calls?.length ?? 0;
  console.log(sym, "ok", !!r, "spot", spot, "exps", exps.length, "calls", calls, r ? "" : j);
}

// fetch specific expiration for SPY
const base = await fetch("https://query1.finance.yahoo.com/v7/finance/options/SPY", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.json());
const expTs = base.optionChain.result[0].expirationDates[0];
const dated = await fetch(`https://query1.finance.yahoo.com/v7/finance/options/SPY?date=${expTs}`, {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.json());
const chain = dated.optionChain.result[0];
const spot = chain.quote.regularMarketPrice;
const calls = chain.options[0].calls;
const scale = (spot * spot * 100) / 1_000_000;
const sample = calls.slice(0, 3).map((c) => ({
  strike: c.strike,
  gex: c.gamma * c.openInterest * scale,
}));
console.log("\nSPY exp", new Date(expTs * 1000).toISOString().slice(0, 10), "spot", spot, "sample", sample);