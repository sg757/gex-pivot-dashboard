const urls = [
  ["all", "https://api.bullflow.io/v1/gex?ticker=SPY"],
  ["exp param", "https://api.bullflow.io/v1/gex?ticker=SPY&expiration=20260707"],
  ["breakdown", "https://api.bullflow.io/v1/gex?ticker=SPY&breakdown=true"],
  ["per_exp", "https://api.bullflow.io/v1/gex?ticker=SPY&per_expiration=true"],
];

for (const [label, url] of urls) {
  const j = await fetch(url).then((r) => r.json());
  const total = j.strikes.reduce((a, s) => a + s.net_gex, 0);
  const s748 = j.strikes.find((s) => s.strike === 748)?.net_gex;
  const s750 = j.strikes.find((s) => s.strike === 750)?.net_gex;
  console.log(label, {
    keys: Object.keys(j),
    strikes: j.strikes.length,
    total: Math.round(total),
    s748: Math.round(s748),
    s750: Math.round(s750),
    exp0: j.expirations?.[0],
  });
}

// Compare today's expiration net from expirations array vs sum if we could isolate
const all = await fetch("https://api.bullflow.io/v1/gex?ticker=SPY").then((r) => r.json());
const today = "20260707";
const todayExp = all.expirations.find((e) => e.expiration === today);
console.log("\nToday exp aggregate:", todayExp);
console.log("All exp net sum:", all.expirations.reduce((a, e) => a + e.net_gex, 0));
console.log("All strikes net sum:", all.strikes.reduce((a, s) => a + s.net_gex, 0));