async function getYahooCrumb() {
  const cookieRes = await fetch("https://fc.yahoo.com", { redirect: "manual" });
  const cookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
  const crumb = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader },
  }).then((r) => r.text());
  return { cookieHeader, crumb };
}

const { cookieHeader, crumb } = await getYahooCrumb();
const base = await fetch(
  `https://query1.finance.yahoo.com/v7/finance/options/SPY?crumb=${encodeURIComponent(crumb)}`,
  { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
).then((r) => r.json());

const dates = base.optionChain.result[0].expirationDates;
console.log("first 3 dates", dates.slice(0, 3).map((ts) => new Date(ts * 1000).toISOString()));

for (const ts of dates.slice(0, 3)) {
  const chain = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/options/SPY?date=${ts}&crumb=${encodeURIComponent(crumb)}`,
    { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
  ).then((r) => r.json());
  const r = chain.optionChain.result[0];
  const calls = r.options[0].calls;
  const withGex = calls.filter((c) => (c.gamma ?? 0) > 0 && (c.openInterest ?? 0) > 0);
  console.log("ts", ts, "calls", calls.length, "withGex", withGex.length, "sample", withGex.slice(0, 2));
}