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
const chain = await fetch(
  `https://query1.finance.yahoo.com/v7/finance/options/SPY?crumb=${encodeURIComponent(crumb)}`,
  { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
).then((r) => r.json());
const calls = chain.optionChain.result[0].options[0].calls;
console.log(JSON.stringify(calls[50], null, 2));
console.log("fields", Object.keys(calls[0]));