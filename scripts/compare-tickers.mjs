const pairs = [
  ["SPX", "SPXW"],
  ["SPY", "SPY"],
  ["QQQ", "QQQ"],
];

for (const [a, b] of pairs) {
  if (a === b) continue;
  const [ja, jb] = await Promise.all([
    fetch(`https://api.bullflow.io/v1/gex?ticker=${a}`).then((r) => r.json()),
    fetch(`https://api.bullflow.io/v1/gex?ticker=${b}`).then((r) => r.json()),
  ]);
  const ta = ja.strikes.reduce((s, x) => s + x.net_gex, 0);
  const tb = jb.strikes.reduce((s, x) => s + x.net_gex, 0);
  const sa = ja.strikes.find((s) => s.strike === 7500);
  const sb = jb.strikes.find((s) => s.strike === 7500);
  console.log(`${a} vs ${b}:`, {
    strikesA: ja.strikes.length,
    strikesB: jb.strikes.length,
    totalA: Math.round(ta),
    totalB: Math.round(tb),
    s7500A: sa?.net_gex,
    s7500B: sb?.net_gex,
    expsA: ja.expirations.length,
    expsB: jb.expirations.length,
    expA: ja.expirations.slice(0, 2),
    expB: jb.expirations.slice(0, 2),
  });
}