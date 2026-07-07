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
const dates = await fetch(
  `https://query1.finance.yahoo.com/v7/finance/options/SPY?crumb=${encodeURIComponent(crumb)}`,
  { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
).then((r) => r.json()).then((j) => j.optionChain.result[0].expirationDates);

// get 30-day out expiration
const ts = dates[15];
const chain = await fetch(
  `https://query1.finance.yahoo.com/v7/finance/options/SPY?date=${ts}&crumb=${encodeURIComponent(crumb)}`,
  { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
).then((r) => r.json());
const calls = chain.optionChain.result[0].options[0].calls;
const atm = calls.find((c) => Math.abs(c.strike - 748) < 2);
console.log("ATM call", JSON.stringify(atm, null, 2));