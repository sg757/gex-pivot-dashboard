"use client";

import { useCallback, useEffect, useState } from "react";
import ExpirationTable from "@/components/ExpirationTable";
import GEXChart from "@/components/GEXChart";
import KeyLevels from "@/components/KeyLevels";
import OptimalPivots from "@/components/OptimalPivots";
import QuoteHeader from "@/components/QuoteHeader";
import TradePlan from "@/components/TradePlan";
import type { AnalysisReport } from "@/lib/types";

const POPULAR = ["SPY", "SPX", "QQQ", "IWM", "AAPL", "NVDA", "TSLA"];
const REFRESH_MS = 2 * 60_000;

export default function Dashboard() {
  const [symbol, setSymbol] = useState("SPY");
  const [input, setInput] = useState("SPY");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setReport(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(symbol);
    const timer = setInterval(() => load(symbol), REFRESH_MS);
    return () => clearInterval(timer);
  }, [symbol, load]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = input.trim().toUpperCase();
    if (next) setSymbol(next);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-200">GEX Pivot Dashboard</h1>
          <p className="text-xs text-neutral-500">
            Bullflow.io gamma exposure · optimal pivot confluence
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Symbol"
            className="w-28 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
          >
            Analyze
          </button>
        </form>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {POPULAR.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSymbol(s);
              setInput(s);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-mono transition-colors ${
              symbol === s
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
            }`}
          >
            {s}
          </button>
        ))}
        {lastUpdated && (
          <span className="ml-auto self-center text-xs text-neutral-600">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !report ? (
        <div className="grid gap-6">
          <Skeleton height="h-32" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton height="h-80" />
            <Skeleton height="h-80" />
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          <QuoteHeader report={report} />
          <TradePlan plan={report.tradePlan} />
          <div className="grid gap-6 lg:grid-cols-2">
            <GEXChart analysis={report.gexAnalysis} />
            <KeyLevels analysis={report.gexAnalysis} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <OptimalPivots pivots={report.optimalPivots} />
            <ExpirationTable expirations={report.gexAnalysis.expirations} />
          </div>
        </div>
      ) : null}

      <footer className="mt-10 text-center text-xs text-neutral-600">
        GEX data via Bullflow.io · Quotes via Yahoo Finance · Not investment advice
      </footer>
    </main>
  );
}

function Skeleton({ height }: { height: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-neutral-800 bg-neutral-900 ${height}`}
    />
  );
}