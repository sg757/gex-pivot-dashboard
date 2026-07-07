import { fetchBullflowGEX } from "./bullflow";
import { computeGEXFromOptions } from "./compute-gex";
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

async function fetchGEXData(
  resolved: ReturnType<typeof resolveSymbol>,
  expiration: ExpirationFilter,
  bullflowAll: BullflowGEXResponse,
): Promise<{ gex: BullflowGEXResponse; source: "bullflow" | "computed" }> {
  if (expiration === "all") {
    return { gex: bullflowAll, source: "bullflow" };
  }

  const chain = await fetchOptionsForExpiration(resolved.display, expiration);
  const spot = chain.spotPrice || (await fetchQuote(resolved.display)).price;

  const computed = computeGEXFromOptions(
    chain.calls,
    chain.puts,
    spot,
    chain.expirationUnix,
    bullflowAll.expirations,
  );

  return { gex: computed, source: "computed" };
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