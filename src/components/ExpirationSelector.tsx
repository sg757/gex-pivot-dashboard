import type { ExpirationOption } from "@/lib/types";

function formatNetGex(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}

export default function ExpirationSelector({
  options,
  value,
  onChange,
  disabled,
}: {
  options: ExpirationOption[];
  value: string;
  onChange: (expiration: string) => void;
  disabled?: boolean;
}) {
  if (options.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="expiration-select" className="text-xs text-neutral-500">
        Expiration
      </label>
      <select
        id="expiration-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[200px] rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500/50 disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
            {opt.value !== "all" ? ` · net ${formatNetGex(opt.netGex)}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}