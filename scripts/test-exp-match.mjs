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
const j = await fetch(`https://query1.finance.yahoo.com/v7/finance/options/SPY?crumb=${encodeURIComponent(crumb)}`, {
  headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader },
}).then((r) => r.json());

const dates = j.optionChain.result[0].expirationDates;
console.log("Yahoo expirations (first 8):");
for (const ts of dates.slice(0, 8)) {
  const d = new Date(ts * 1000);
  console.log(ts, d.toISOString(), d.toLocaleDateString("en-US", { timeZone: "America/New_York" }));
}

const bull = await fetch("https://api.bullflow.io/v1/gex?ticker=SPY").then((r) => r.json());
console.log("\nBullflow expirations (first 8):");
for (const e of bull.expirations.slice(0, 8)) {
  console.log(e.expiration);
}