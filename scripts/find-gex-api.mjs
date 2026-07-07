import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const t = fs.readFileSync(join(__dirname, "bullflow.js"), "utf8");

const patterns = [
  /\/v1\/gex[^"'\s]*/g,
  /gex\?[^"'\s]*/g,
  /expiration[^"'\s]{0,60}/gi,
  /expirations[^"'\s]{0,60}/gi,
  /api\.bullflow\.io[^"'\s]*/g,
];

for (const p of patterns) {
  const hits = [...new Set(t.match(p) || [])].slice(0, 30);
  if (hits.length) {
    console.log(`\n=== ${p} ===`);
    console.log(hits.join("\n"));
  }
}

// context around v1/gex
let pos = 0;
let count = 0;
while (count < 5) {
  const i = t.indexOf("v1/gex", pos);
  if (i === -1) break;
  console.log("\n--- context ---\n", t.slice(Math.max(0, i - 100), i + 200).replace(/\n/g, " "));
  pos = i + 6;
  count++;
}