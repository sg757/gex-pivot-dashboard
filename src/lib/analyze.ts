import { fetchBullflowGEX } from "./bullflow";
import { computeGEXFromOptions } from "./compute-gex";
import {
  hasActiveGEXStrikes,
  hasMeaningfulNearbyGEX,
  scaleBullflowGEXByExpiration,
} from "./scale-gex";
import { findOptimalPivots, summarizeTradePlan } from "./confluence";
import {
  formatExpirationLabel,
  nearestDteExpiration,
  sortExpirations,
} from "./expirations";
import { analyzeGEX } from "./gex-analysis";
import { allTraditionalPivots } from "./pivots";
import { fetchQuote } from "./quote";
import { resolveSymbol } from "./symbols";
import { fetchOptionsForExpiration } from "./yahoo-options";
import type { AnalysisReport, BullflowGEXResponse, ExpirationOption } from "./types";

export type ExpirationFilter = "all" | string;

function buildExpirationOptions(
  expirations: BullflowGEXResponse["expirations"],
): ExpirationOption[] {
  const nearest = nearestDteExpiration(expirations);
  const sorted = sortExpirations(expirations);

  return [
    { value: "all", label: "All Expirations", netGex: 0 },
    ...sorted.map((e) => ({
      value: e.expiration,
      label: formatExpirationLabel(e.expiration, nearest),
      netGex: e.net_gex,
    })),
  ];
}

function chainHasOpenInterest(calls: { openInterest?: number }[], puts: { openInterest?: number }[]) {
  return (
    calls.some((c) => (c.openInterest ?? 0) > 0) ||
    puts.some((p) => (p.openInterest ?? 0) > 0)
  );
}

async function fetchGEXData(
  resolved: ReturnType<typeof resolveSymbol>,
  expiration: ExpirationFilter,
  bullflowAll: BullflowGEXResponse,
): Promise<{ gex: BullflowGEXResponse; source: "bullflow" | "computed" | "bullflow-scaled" }> {
  if (expiration === "all") {
    return { gex: bullflowAll, source: "bullflow" };
  }

  if (!resolved.preferBullflowScaled) {
    try {
      const chain = await fetchOptionsForExpiration(resolved.display, expiration);
      if (chainHasOpenInterest(chain.calls, chain.puts)) {
        const spot = chain.spotPrice || (await fetchQuote(resolved.display)).price;
        const computed = computeGEXFromOptions(
          chain.calls,
          chain.puts,
          spot,
          chain.expirationUnix,
          expiration,
          bullflowAll.expirations,
        );
        if (hasMeaningfulNearbyGEX(computed, spot)) {
          return { gex: computed, source: "computed" };
        }
      }
    } catch {
      // Yahoo chain unavailable or missing OI — fall back to Bullflow scaling.
    }
  }

  const scaled = scaleBullflowGEXByExpiration(bullflowAll, expiration);
  if (!scaled || !hasActiveGEXStrikes(scaled)) {
    throw new Error(`No GEX data available for expiration ${expiration}`);
  }

  return { gex: scaled, source: "bullflow-scaled" };
}

export async function runAnalysis(
  ticker: string,
  expiration: ExpirationFilter = "all",
): Promise<AnalysisReport> {
  const resolved = resolveSymbol(ticker);

  const [quote, bullflowAll] = await Promise.all([
    fetchQuote(resolved.display),
    fetchBullflowGEX(resolved.bullflow, process.env.BULLFLOW_API_KEY),
  ]);

  const expirationOptions = buildExpirationOptions(bullflowAll.expirations);
  const selectedExpiration = expiration === "all" ? "all" : expiration;
  const nearest = nearestDteExpiration(bullflowAll.expirations);

  const selectedExpirationLabel =
    selectedExpiration === "all"
      ? "All Expirations"
      : formatExpirationLabel(selectedExpiration, nearest);

  const { gex, source } = await fetchGEXData(
    resolved,
    selectedExpiration,
    bullflowAll,
  );

  const gexAnalysisBase = analyzeGEX(gex, quote.price);
  const gexAnalysis = {
    ...gexAnalysisBase,
    expirations: bullflowAll.expirations,
    selectedExpiration,
    selectedExpirationLabel,
    gexSource: source,
  };

  const traditionalPivots = allTraditionalPivots(quote.previousSession);
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

  return {
    ticker: resolved.display,
    asOf: new Date().toISOString(),
    quote,
    gexAnalysis,
    traditionalPivots,
    optimalPivots,
    tradePlan,
    expirationOptions,
  };
}