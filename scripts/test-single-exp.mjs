// Quick integration test mirroring analyze.ts flow
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Inline minimal test using same libs via dynamic import won't work for TS.
// Use fetch against local API after dev server, or duplicate logic here.

import { blackScholesGamma, normalizeIv, yearsToExpiration } from "../src/lib/black-scholes.ts";
console.log("gamma sample", blackScholesGamma(748, 750, 1/365, 0.18));