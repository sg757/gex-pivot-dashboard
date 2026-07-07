#!/usr/bin/env node

import { fetchBullflowGEX, loadGEXFromFile } from "./lib/bullflow.mjs";
import { analyzeGEX } from "./lib/gex-analysis.mjs";
import { fetchQuote } from "./lib/quote.mjs";
import { allTraditionalPivots } from "./lib/pivots.mjs";
import { findOptimalPivots, summarizeTradePlan } from "./lib/confluence.mjs";

function printHelp() {
  console.log(`
GEX Pivot Analyzer — Bullflow.io gamma exposure + optimal pivot points

Usage:
  node analyze.mjs <TICKER> [options]

Options:
  --file <path>       Load GEX from a saved Bullflow JSON file instead of API
  --spot <price>      Override spot price (skips Yahoo quote fetch)
  --json              Output full JSON report
  --top <n>           Show top N optimal pivots (default: 8)
  --api-key <key>     Bullflow API key (optional; public endpoint works without)
  --help              Show this help

Examples:
  node analyze.mjs SPY
  node analyze.mjs QQQ --json
  node analyze.mjs SPY --file ./spy_gex.json --spot 747.62
`);
}

function parseArgs(argv) {
  const args = {
    ticker: "SPY",
    file: null,
    spot: null,
    json: false,
    top: 8,
    apiKey: process.env.BULLFLOW_API_KEY ?? null,
    help: false,
  };

  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--file") args.file = argv[++i];
    else if (arg === "--spot") args.spot = Number(argv[++i]);
    else if (arg === "--top") args.top = Number(argv[++i]);
    else if (arg === "--api-key") args.apiKey = argv[++i];
    else if (!arg.startsWith("-")) positional.push(arg.toUpperCase());
  }

  if (positional[0]) args.ticker = positional[0];
  return args;
}

function formatMoney(n) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

function printReport(report, topN) {
  const { ticker, quote, gexAnalysis, optimalPivots, tradePlan } = report;

  console.log(`\n${"=".repeat(64)}`);
  console.log(`  ${ticker} GEX Pivot Analysis (Bullflow.io)`);
  console.log(`${"=".repeat(64)}`);
  console.log(`  Spot:          $${quote.price.toFixed(2)}`);
  console.log(`  Net GEX:       ${formatMoney(gexAnalysis.totalNetGEX)}`);
  console.log(`  Gamma regime:  ${gexAnalysis.gammaRegime.toUpperCase()}`);
  console.log(`  Strategy:      ${tradePlan.strategy}`);

  console.log(`\n--- GEX Key Levels ---`);
  for (const level of gexAnalysis.levels) {
    console.log(
      `  ${level.type.padEnd(22)} $${String(level.strike).padStart(8)}  (${level.role})`,
    );
  }

  if (gexAnalysis.expirations.length > 0) {
    const sorted = [...gexAnalysis.expirations].sort(
      (a, b) => Math.abs(b.net_gex) - Math.abs(a.net_gex),
    );
    const top = sorted.slice(0, 3);
    console.log(`\n--- Top Expiration GEX ---`);
    for (const exp of top) {
      const date = `${exp.expiration.slice(0, 4)}-${exp.expiration.slice(4, 6)}-${exp.expiration.slice(6, 8)}`;
      console.log(
        `  ${date}  net ${formatMoney(exp.net_gex).padStart(10)}  (call ${formatMoney(exp.call_gex)}, put ${formatMoney(exp.put_gex)})`,
      );
    }
  }

  console.log(`\n--- Optimal Pivot Points (ranked by confluence) ---`);
  for (const [i, pivot] of optimalPivots.slice(0, topN).entries()) {
    const marker =
      pivot.role === "regime_boundary"
        ? "FLIP"
        : pivot.role === "support"
          ? "SUP "
          : pivot.role === "resistance"
            ? "RES "
            : "PIV ";
    console.log(
      `  ${String(i + 1).padStart(2)}. [${marker}] $${pivot.price.toFixed(2)}  score ${pivot.score}  (${pivot.sources.length} signals)`,
    );
    console.log(`      ${pivot.recommendation}`);
  }

  console.log(`\n--- Trade Plan ---`);
  if (tradePlan.nearestSupport) {
    console.log(
      `  Support:     $${tradePlan.nearestSupport.price.toFixed(2)} — ${tradePlan.nearestSupport.sources.join(", ")}`,
    );
  }
  if (tradePlan.nearestResistance) {
    console.log(
      `  Resistance:  $${tradePlan.nearestResistance.price.toFixed(2)} — ${tradePlan.nearestResistance.sources.join(", ")}`,
    );
  }
  if (tradePlan.bullishTrigger) {
    console.log(`  Bull trigger: Reclaim above $${tradePlan.bullishTrigger.toFixed(2)}`);
  }
  if (tradePlan.bearishTrigger) {
    console.log(`  Bear trigger: Break below $${tradePlan.bearishTrigger.toFixed(2)}`);
  }

  console.log(`\n${"=".repeat(64)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  let quote;
  if (args.spot === null) {
    quote = await fetchQuote(args.ticker);
  } else {
    try {
      quote = await fetchQuote(args.ticker);
      quote.price = args.spot;
    } catch {
      quote = {
        symbol: args.ticker,
        price: args.spot,
        previousSession: {
          high: args.spot * 1.005,
          low: args.spot * 0.995,
          close: args.spot,
          open: args.spot,
        },
      };
    }
  }

  const gex = args.file
    ? await loadGEXFromFile(args.file)
    : await fetchBullflowGEX(args.ticker, { apiKey: args.apiKey ?? undefined });

  const gexAnalysis = analyzeGEX(gex, quote.price);
  const traditionalPivots = quote.previousSession
    ? allTraditionalPivots(quote.previousSession)
    : [];
  const optimalPivots = findOptimalPivots(
    gexAnalysis.levels,
    traditionalPivots,
    quote.price,
  );
  const tradePlan = summarizeTradePlan(
    optimalPivots,
    quote.price,
    gexAnalysis.gammaRegime,
  );

  const report = {
    ticker: args.ticker,
    asOf: new Date().toISOString(),
    quote,
    gexAnalysis,
    traditionalPivots,
    optimalPivots,
    tradePlan,
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report, args.top);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});