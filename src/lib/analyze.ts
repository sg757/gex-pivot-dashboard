import { fetchBullflowGEX } from "./bullflow";
import { findOptimalPivots, summarizeTradePlan } from "./confluence";
import { analyzeGEX } from "./gex-analysis";
import { allTraditionalPivots } from "./pivots";
import { fetchQuote } from "./quote";
import type { AnalysisReport } from "./types";

export async function runAnalysis(ticker: string): Promise<AnalysisReport> {
  const [quote, gex] = await Promise.all([
    fetchQuote(ticker),
    fetchBullflowGEX(ticker, process.env.BULLFLOW_API_KEY),
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
    ticker: ticker.toUpperCase(),
    asOf: new Date().toISOString(),
    quote,
    gexAnalysis,
    traditionalPivots,
    optimalPivots,
    tradePlan,
  };
}