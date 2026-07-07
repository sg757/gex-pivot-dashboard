import type { TradePlan as TradePlanType } from "@/lib/types";

export default function TradePlan({ plan }: { plan: TradePlanType }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-300">Trade Plan</h2>
      <p className="mb-4 rounded-lg bg-neutral-800/60 px-3 py-2 text-sm text-neutral-300">
        {plan.strategy}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {plan.nearestSupport && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-400">
              Nearest Support
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-emerald-300">
              ${plan.nearestSupport.price.toFixed(2)}
            </div>
          </div>
        )}
        {plan.nearestResistance && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-red-400">
              Nearest Resistance
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-red-300">
              ${plan.nearestResistance.price.toFixed(2)}
            </div>
          </div>
        )}
        {plan.bullishTrigger !== null && (
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/40 p-3">
            <div className="text-xs text-neutral-500">Bull Trigger</div>
            <div className="mt-1 font-mono text-lg text-emerald-400">
              Reclaim ${plan.bullishTrigger.toFixed(2)}
            </div>
          </div>
        )}
        {plan.bearishTrigger !== null && (
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/40 p-3">
            <div className="text-xs text-neutral-500">Bear Trigger</div>
            <div className="mt-1 font-mono text-lg text-red-400">
              Break ${plan.bearishTrigger.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}