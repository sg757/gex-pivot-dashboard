import { fetchBullflowGEX } from "./bullflow";
import { findOptimalPivots, summarizeTradePlan } from "./confluence";
import { analyzeGEX } from "./gex-analysis";
import { allTraditionalPivots } from "./pivots";
import { fetchQuote } from "./quote";
import { resolveSymbol } from "./symbols";
import type { AnalysisReport } from "./types";

export async function runAnalysis(ticker: string): Promise<AnalysisReport> {
  const resolved = resolveSymbol(ticker);

  const [quote, gex] = await Promise.all([
    fetchQuote(resolved.display),
    fetchBullflowGEX(resolved.bullflow, process.env.BULLFLOW_API_KEY),
  ]);

  const gexAnalysis = analyzeGEX(gex, quote.price);
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
  };
}