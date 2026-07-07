import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const t = fs.readFileSync(join(dirname(fileURLToPath(import.meta.url)), "bullflow.js"), "utf8");

const needles = ["gex", "GEX", "gamma_flip", "call_gex", "net_gex", "bullflow.io/v1"];
for (const needle of needles) {
  let pos = 0;
  let n = 0;
  while (n < 3) {
    const i = t.indexOf(needle, pos);
    if (i === -1) break;
    console.log(`\n[${needle}]`, t.slice(Math.max(0, i - 80), i + 120).replace(/\n/g, " "));
    pos = i + needle.length;
    n++;
  }
}