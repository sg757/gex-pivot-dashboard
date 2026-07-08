"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GEXAnalysis } from "@/lib/types";

function formatGex(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}

export default function GEXChart({ analysis }: { analysis: GEXAnalysis }) {
  const range = analysis.spotPrice * 0.04;
  const flip = analysis.levels.find((l) => l.type === "gamma_flip");

  const data = analysis.nearbyStrikes
    .filter(
      (s) =>
        s.strike >= analysis.spotPrice - range &&
        s.strike <= analysis.spotPrice + range,
    )
    .map((s) => ({
      strike: s.strike.toFixed(s.strike % 1 === 0 ? 0 : 1),
      netGex: Math.round(s.net_gex * 100) / 100,
    }));

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-300">Net GEX by Strike</h2>
        <span className="text-xs text-neutral-500">
          {analysis.selectedExpirationLabel ?? "All Expirations"}
          {analysis.gexSource === "computed" ? " · computed" : " · Bullflow"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 10, right: 10 }}>
          <XAxis
            dataKey="strike"
            tick={{ fontSize: 11, fill: "#a3a3a3" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#a3a3a3" }}
            width={55}
            tickFormatter={formatGex}
          />
          <Tooltip
            contentStyle={{
              background: "#171717",
              border: "1px solid #404040",
              color: "#e5e5e5",
            }}
            labelStyle={{ color: "#e5e5e5" }}
            itemStyle={{ color: "#f5f5f5" }}
            formatter={(value) => [formatGex(Number(value)), "Net GEX"]}
          />
          <ReferenceLine y={0} stroke="#525252" />
          <ReferenceLine
            x={analysis.spotPrice.toFixed(0)}
            stroke="#60a5fa"
            strokeDasharray="4 2"
            label={{ value: "Spot", fill: "#60a5fa", fontSize: 10 }}
          />
          {flip && (
            <ReferenceLine
              x={flip.strike.toFixed(flip.strike % 1 === 0 ? 0 : 1)}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              label={{ value: "Flip", fill: "#f59e0b", fontSize: 10 }}
            />
          )}
          <Bar dataKey="netGex" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.netGex >= 0 ? "#10b981" : "#f87171"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}