import { blackScholesGamma, normalizeIv, yearsToExpiration } from "../src/lib/black-scholes.ts";

async function getYahooCrumb() {
  const cookieRes = await fetch("https://fc.yahoo.com", { redirect: "manual" });
  const cookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
  const crumb = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": "Mozilla/5.0", Cookie: cookie },
  }).then((r) => r.text());
  return { cookie, crumb };
}

function yahooExpiryToBullflowKey(unixTs) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(unixTs * 1000));
  return `${parts.find((p) => p.type === "year").value}${parts.find((p) => p.type === "month").value}${parts.find((p) => p.type === "day").value}`;
}

const { cookie, crumb } = await getYahooCrumb();
const dates = await fetch(`https://query1.finance.yahoo.com/v7/finance/options/SPY?crumb=${encodeURIComponent(crumb)}`, {
  headers: { "User-Agent": "Mozilla/5.0", Cookie: cookie },
}).then((r) => r.json()).then((j) => j.optionChain.result[0].expirationDates);

const target = "20260714";
const ts = dates.find((t) => yahooExpiryToBullflowKey(t) === target);
const chain = await fetch(`https://query1.finance.yahoo.com/v7/finance/options/SPY?date=${ts}&crumb=${encodeURIComponent(crumb)}`, {
  headers: { "User-Agent": "Mozilla/5.0", Cookie: cookie },
}).then((r) => r.json());
const r = chain.optionChain.result[0];
const spot = r.quote.regularMarketPrice;
const calls = r.options[0].calls;
const puts = r.options[0].puts;
const timeYears = yearsToExpiration(ts);

function total(scaleFn) {
  let t = 0;
  for (const c of calls) {
    const oi = c.openInterest ?? 0;
    if (!oi) continue;
    const g = blackScholesGamma(spot, c.strike, timeYears, normalizeIv(c.impliedVolatility));
    t += g * oi * scaleFn(spot);
  }
  for (const p of puts) {
    const oi = p.openInterest ?? 0;
    if (!oi) continue;
    const g = blackScholesGamma(spot, p.strike, timeYears, normalizeIv(p.impliedVolatility));
    t -= g * oi * scaleFn(spot);
  }
  return t;
}

const bull = await fetch("https://api.bullflow.io/v1/gex?ticker=SPY").then((r) => r.json());
const bullExp = bull.expirations.find((e) => e.expiration === target);

const scales = {
  "S2*100": (s) => s * s * 100,
  "S2*100*0.01": (s) => s * s * 100 * 0.01,
  "S2*100/1e6": (s) => (s * s * 100) / 1e6,
  "S2": (s) => s * s,
};
for (const [name, fn] of Object.entries(scales)) {
  console.log(name, Math.round(total(fn)), "vs bull net", Math.round(bullExp?.net_gex));
}