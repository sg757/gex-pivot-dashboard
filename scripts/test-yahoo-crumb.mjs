async function getYahooCrumb() {
  const cookieRes = await fetch("https://fc.yahoo.com", { redirect: "manual" });
  const cookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");

  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Cookie: cookieHeader,
    },
  });
  const crumb = await crumbRes.text();
  return { cookieHeader, crumb };
}

const { cookieHeader, crumb } = await getYahooCrumb();
console.log("crumb", crumb, "cookies", cookieHeader.slice(0, 80));

const url = `https://query1.finance.yahoo.com/v7/finance/options/SPY?crumb=${encodeURIComponent(crumb)}`;
const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "application/json",
    Cookie: cookieHeader,
  },
});
const j = await res.json();
const r = j?.optionChain?.result?.[0];
console.log("options ok", !!r, "exps", r?.expirationDates?.length, j?.finance?.error);
if (r) {
  const expTs = r.expirationDates[0];
  const url2 = `https://query1.finance.yahoo.com/v7/finance/options/SPY?date=${expTs}&crumb=${encodeURIComponent(crumb)}`;
  const res2 = await fetch(url2, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Cookie: cookieHeader,
    },
  });
  const j2 = await res2.json();
  const r2 = j2?.optionChain?.result?.[0];
  console.log("dated ok", !!r2, "calls", r2?.options?.[0]?.calls?.length);
}