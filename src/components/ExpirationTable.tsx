import type { BullflowExpiration } from "@/lib/types";

function formatExp(date: string) {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

function formatMoney(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export default function ExpirationTable({
  expirations,
}: {
  expirations: BullflowExpiration[];
}) {
  const sorted = [...expirations]
    .sort((a, b) => Math.abs(b.net_gex) - Math.abs(a.net_gex))
    .slice(0, 6);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-300">
        Top Expiration GEX
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs text-neutral-500">
              <th className="pb-2 pr-4">Expiration</th>
              <th className="pb-2 pr-4">Net GEX</th>
              <th className="pb-2 pr-4">Call GEX</th>
              <th className="pb-2">Put GEX</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((exp) => (
              <tr key={exp.expiration} className="border-b border-neutral-800/50">
                <td className="py-2 pr-4 font-mono text-neutral-300">
                  {formatExp(exp.expiration)}
                </td>
                <td
                  className={`py-2 pr-4 font-mono ${exp.net_gex >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {formatMoney(exp.net_gex)}
                </td>
                <td className="py-2 pr-4 font-mono text-neutral-400">
                  {formatMoney(exp.call_gex)}
                </td>
                <td className="py-2 font-mono text-neutral-400">
                  {formatMoney(exp.put_gex)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}