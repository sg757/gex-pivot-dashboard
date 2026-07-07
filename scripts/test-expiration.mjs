const params = [
  "",
  "expiration=20260707",
  "exp=20260707",
  "expiry=20260707",
  "date=20260707",
  "expiration_date=20260707",
  "dte=0",
  "days_to_expiration=0",
];

for (const p of params) {
  const url = `https://api.bullflow.io/v1/gex?ticker=SPY${p ? `&${p}` : ""}`;
  const res = await fetch(url);
  const j = await res.json();
  const total = j.strikes?.reduce((a, x) => a + x.net_gex, 0) ?? 0;
  const s748 = j.strikes?.find((s) => s.strike === 748)?.net_gex;
  console.log(p || "(all)", "total", Math.round(total), "748", s748, "exps", j.expirations?.length, j.error ?? "");
}

// alternate URL patterns
const urls = [
  "https://api.bullflow.io/v1/gex/SPY/20260707",
  "https://api.bullflow.io/v1/gex/SPY?expiration=20260707",
];
for (const url of urls) {
  const res = await fetch(url);
  const text = await res.text();
  console.log(url, res.status, text.slice(0, 120));
}