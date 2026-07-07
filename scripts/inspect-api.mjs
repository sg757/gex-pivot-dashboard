import fs from "node:fs";

// Probe alternate Bullflow endpoints
const endpoints = [
  "https://api.bullflow.io/v1/gex?ticker=SPY&expiration=20260707",
  "https://api.bullflow.io/v1/gex/strikes?ticker=SPY&expiration=20260707",
  "https://api.bullflow.io/v1/gex/by-expiration?ticker=SPY",
  "https://api.bullflow.io/v1/gex?ticker=SPY&aggregate=false",
  "https://api.bullflow.io/v2/gex?ticker=SPY",
  "https://api.bullflow.io/v2/gex?ticker=SPY&expiration=20260707",
];

for (const url of endpoints) {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();
    let summary = text.slice(0, 100).replace(/\n/g, " ");
    if (text.startsWith("{")) {
      const j = JSON.parse(text);
      summary = `strikes=${j.strikes?.length} exps=${j.expirations?.length} keys=${Object.keys(j).join(",")} err=${j.error ?? ""}`;
    }
    console.log(res.status, url.split("api.bullflow.io")[1], "->", summary);
  } catch (e) {
    console.log("ERR", url, e.message);
  }
}

// Check if strikes have per-expiration breakdown in nested fields
const res = await fetch("https://api.bullflow.io/v1/gex?ticker=SPY");
const data = await res.json();
const sample = data.strikes.find((s) => s.strike === 748);
console.log("\nSample strike 748 keys:", Object.keys(sample));
console.log("Sample:", JSON.stringify(sample));

// Check if any strike has extra fields
const withExtra = data.strikes.find((s) => Object.keys(s).length > 4);
console.log("Strike with extra fields:", withExtra);