import type { GEXAnalysis } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  gamma_flip: "Gamma Flip",
  call_wall: "Call Wall",
  put_wall: "Put Wall",
  max_positive_gex: "Max +GEX",
  max_negative_gex: "Max -GEX",
  gex_magnet_positive: "+GEX Magnet",
  gex_magnet_negative: "-GEX Magnet",
};

export default function KeyLevels({ analysis }: { analysis: GEXAnalysis }) {
  const isPositive = analysis.gammaRegime === "positive";

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-300">GEX Key Levels</h2>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <span className="text-neutral-400">
          Net GEX:{" "}
          <span
            className={`font-mono font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
          >
            {analysis.totalNetGEX >= 0 ? "+" : ""}
            {(analysis.totalNetGEX / 1e6).toFixed(2)}M
          </span>
        </span>
        <span className="text-neutral-400">
          Regime:{" "}
          <span
            className={`font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
          >
            {isPositive ? "Positive (stabilizing)" : "Negative (volatile)"}
          </span>
        </span>
      </div>
      <ul className="space-y-2">
        {analysis.levels.map((level) => (
          <li
            key={`${level.type}-${level.strike}`}
            className="flex items-start justify-between gap-4 rounded-lg bg-neutral-800/50 px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium text-neutral-200">
                {TYPE_LABELS[level.type] ?? level.type}
              </span>
              <p className="mt-0.5 text-xs text-neutral-500">{level.description}</p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-amber-400">
              ${level.strike.toFixed(level.strike % 1 === 0 ? 0 : 2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}