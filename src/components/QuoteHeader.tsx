import type { AnalysisReport } from "@/lib/types";

export default function QuoteHeader({ report }: { report: AnalysisReport }) {
  const { quote, gexAnalysis } = report;
  const isPositive = gexAnalysis.gammaRegime === "positive";

  return (
    <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-900/60 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-sm text-neutral-500">
            {gexAnalysis.selectedExpirationLabel ?? "All Expirations"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{report.ticker}</h1>
          <div className="mt-2 font-mono text-3xl font-semibold text-neutral-100">
            ${quote.price.toFixed(2)}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div
            className={`rounded-lg border px-4 py-2 ${isPositive ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}
          >
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Gamma Regime
            </div>
            <div
              className={`font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
            >
              {isPositive ? "Positive" : "Negative"}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Net GEX
            </div>
            <div
              className={`font-mono font-semibold ${gexAnalysis.totalNetGEX >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {(gexAnalysis.totalNetGEX / 1e6).toFixed(2)}M
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}