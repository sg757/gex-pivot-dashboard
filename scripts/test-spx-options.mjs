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
for (const sym of ["SPX", "^SPX", "SPXW"]) {
  const j = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(sym)}?crumb=${encodeURIComponent(crumb)}`,
    { headers: { "User-Agent": "Mozilla/5.0", Cookie: cookieHeader } },
  ).then((r) => r.json());
  const r = j?.optionChain?.result?.[0];
  console.log(sym, !!r, r?.quote?.regularMarketPrice, r?.expirationDates?.length);
}