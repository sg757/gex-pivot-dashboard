async function getYahooCrumb() {
  const cookieRes = await fetch("https://fc.yahoo.com", { redirect: "manual" });
  const cookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
  const crumb = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader },
  }).then((r) => r.text());
  return { cookieHeader, crumb };
}

function formatEtExpiry(ts) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ts * 1000));
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}${m}${d}`;
}

function computeGex(calls, puts, spot) {
  const map = new Map();
  const scale = spot * spot * 100; // raw like bullflow
  for (const c of calls) {
    const s = c.strike;
    if (!map.has(s)) map.set(s, { strike: s, call_gex: 0, put_gex: 0, net_gex: 0 });
    map.get(s).call_gex += (c.gamma ?? 0) * (c.openInterest ?? 0) * scale;
  }
  for (const p of puts) {
    const s = p.strike;
    if (!map.has(s)) map.set(s, { strike: s, call_gex: 0, put_gex: 0, net_gex: 0 });
    map.get(s).put_gex -= (p.gamma ?? 0) * (p.openInterest ?? 0) * scale;
  }
  for (const v of map.values()) v.net_gex = v.call_gex + v.put_gex;
  return [...map.values()];
}

const { cookieHeader, crumb } = await getYahooCrumb();
const base = await fetch(
  `https://query1.finance.yahoo.com/v7/finance/options/SPY?crumb=${encodeURIComponent(crumb)}`,
  { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
).then((r) => r.json());
const dates = base.optionChain.result[0].expirationDates;
const target = "20260707";
const ts = dates.find((t) => formatEtExpiry(t) === target);
console.log("matched ts", ts, formatEtExpiry(ts));

const chain = await fetch(
  `https://query1.finance.yahoo.com/v7/finance/options/SPY?date=${ts}&crumb=${encodeURIComponent(crumb)}`,
  { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
).then((r) => r.json());
const r = chain.optionChain.result[0];
const spot = r.quote.regularMarketPrice;
const calls = r.options[0].calls;
const puts = r.options[0].puts;
const strikes = computeGex(calls, puts, spot);
const total = strikes.reduce((a, s) => a + s.net_gex, 0);
const s748 = strikes.find((s) => s.strike === 748);

const bull = await fetch("https://api.bullflow.io/v1/gex?ticker=SPY").then((r) => r.json());
const bullExp = bull.expirations.find((e) => e.expiration === target);
const bull748 = bull.strikes.find((s) => s.strike === 748);

console.log({ yahooTotal: Math.round(total), bullExpNet: Math.round(bullExp?.net_gex), bullAllTotal: Math.round(bull.strikes.reduce((a,s)=>a+s.net_gex,0)) });
console.log({ yahoo748: Math.round(s748?.net_gex), bull748: Math.round(bull748?.net_gex) });