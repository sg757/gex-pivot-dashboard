import type { OptimalPivot } from "@/lib/types";

const ROLE_STYLES: Record<OptimalPivot["role"], string> = {
  regime_boundary: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  support: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  resistance: "bg-red-500/20 text-red-300 border-red-500/30",
  pivot: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const ROLE_LABELS: Record<OptimalPivot["role"], string> = {
  regime_boundary: "FLIP",
  support: "SUP",
  resistance: "RES",
  pivot: "PIV",
};

export default function OptimalPivots({
  pivots,
  limit = 8,
}: {
  pivots: OptimalPivot[];
  limit?: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-300">
        Optimal Pivot Points
      </h2>
      <p className="mb-4 text-xs text-neutral-500">
        Ranked by GEX + traditional pivot confluence score
      </p>
      <ul className="space-y-3">
        {pivots.slice(0, limit).map((pivot, i) => (
          <li
            key={`${pivot.price}-${i}`}
            className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">#{i + 1}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${ROLE_STYLES[pivot.role]}`}
                >
                  {ROLE_LABELS[pivot.role]}
                </span>
                <span className="font-mono text-base font-semibold text-neutral-100">
                  ${pivot.price.toFixed(2)}
                </span>
              </div>
              <span className="font-mono text-sm text-neutral-400">
                score {pivot.score}
              </span>
            </div>
            <p className="text-xs text-neutral-400">{pivot.recommendation}</p>
            <p className="mt-1 text-[10px] text-neutral-600">
              {pivot.sources.join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}