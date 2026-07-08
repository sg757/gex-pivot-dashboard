export interface ResolvedSymbol {
  /** User-facing / display ticker */
  display: string;
  /** Bullflow.io GEX API ticker */
  bullflow: string;
  /** Yahoo Finance chart symbol */
  yahoo: string;
  /** Yahoo Finance options chain symbol (defaults to yahoo) */
  yahooOptions?: string;
}

/** Index and alias mappings — Bullflow ticker → Yahoo quote symbol */
const INDEX_MAP: Record<string, ResolvedSymbol> = {
  SPX: { display: "SPX", bullflow: "SPX", yahoo: "^GSPC", yahooOptions: "^SPX" },
  GSPC: { display: "SPX", bullflow: "SPX", yahoo: "^GSPC", yahooOptions: "^SPX" },
  SPXW: { display: "SPXW", bullflow: "SPXW", yahoo: "^GSPC", yahooOptions: "^SPX" },
  RUT: { display: "RUT", bullflow: "RUT", yahoo: "^RUT", yahooOptions: "^RUT" },
  VIX: { display: "VIX", bullflow: "VIX", yahoo: "^VIX", yahooOptions: "^VIX" },
};

/**
 * Normalize user input and resolve provider-specific ticker symbols.
 * Stocks/ETFs pass through unchanged; indices map to Yahoo ^-prefixed symbols.
 */
export function resolveSymbol(input: string): ResolvedSymbol {
  const raw = input.trim().toUpperCase().replace(/^\$/, "");
  if (!raw) throw new Error("Symbol is required");

  if (INDEX_MAP[raw]) return INDEX_MAP[raw];

  // Allow ^GSPC style input → SPX display
  const stripped = raw.replace(/^\^/, "");
  if (INDEX_MAP[stripped]) return INDEX_MAP[stripped];

  return {
    display: raw,
    bullflow: raw,
    yahoo: raw,
  };
}

export function isValidSymbol(input: string): boolean {
  const raw = input.trim().toUpperCase().replace(/^\$/, "").replace(/^\^/, "");
  return /^[A-Z][A-Z0-9.\-]{0,9}$/.test(raw);
}