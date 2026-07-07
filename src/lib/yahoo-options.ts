import { resolveSymbol } from "./symbols";
import { yahooExpiryToBullflowKey } from "./expirations";

interface YahooOption {
  strike: number;
  openInterest?: number;
  impliedVolatility?: number;
  expiration?: number;
}

interface OptionsChainResult {
  calls: YahooOption[];
  puts: YahooOption[];
  spotPrice: number;
  expirationDates: number[];
  matchedExpiration: string;
  expirationUnix: number;
}

let cachedCrumb: { cookie: string; crumb: string; fetchedAt: number } | null = null;
const CRUMB_TTL_MS = 30 * 60_000;

async function getYahooCrumb(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCrumb && Date.now() - cachedCrumb.fetchedAt < CRUMB_TTL_MS) {
    return { cookie: cachedCrumb.cookie, crumb: cachedCrumb.crumb };
  }

  const cookieRes = await fetch("https://fc.yahoo.com", {
    redirect: "manual",
    cache: "no-store",
  });
  const cookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Cookie: cookie,
    },
    cache: "no-store",
  });

  if (!crumbRes.ok) throw new Error("Failed to obtain Yahoo crumb");

  const crumb = await crumbRes.text();
  cachedCrumb = { cookie, crumb, fetchedAt: Date.now() };
  return { cookie, crumb };
}

async function fetchOptionsChain(
  optionsSymbol: string,
  expirationTs?: number,
): Promise<{
  calls: YahooOption[];
  puts: YahooOption[];
  spotPrice: number;
  expirationDates: number[];
}> {
  const { cookie, crumb } = await getYahooCrumb();
  const base = "https://query1.finance.yahoo.com/v7/finance/options";
  const url = expirationTs
    ? `${base}/${encodeURIComponent(optionsSymbol)}?date=${expirationTs}&crumb=${encodeURIComponent(crumb)}`
    : `${base}/${encodeURIComponent(optionsSymbol)}?crumb=${encodeURIComponent(crumb)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
      Cookie: cookie,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Yahoo options request failed: ${res.status}`);

  const data = await res.json();
  const result = data?.optionChain?.result?.[0];
  if (!result) {
    throw new Error(
      data?.finance?.error?.description ?? "No options data in Yahoo response",
    );
  }

  const spotPrice: number = result.quote?.regularMarketPrice ?? 0;
  const expirationDates: number[] = result.expirationDates ?? [];
  const chain = result.options?.[0] ?? {};

  return {
    calls: chain.calls ?? [],
    puts: chain.puts ?? [],
    spotPrice,
    expirationDates,
  };
}

/**
 * Fetch Yahoo options chain for a specific Bullflow expiration (YYYYMMDD).
 */
export async function fetchOptionsForExpiration(
  symbol: string,
  bullflowExpiration: string,
): Promise<OptionsChainResult> {
  const resolved = resolveSymbol(symbol);
  const optionsSymbol = resolved.yahooOptions ?? resolved.yahoo;

  const initial = await fetchOptionsChain(optionsSymbol);
  const matchTs = initial.expirationDates.find(
    (ts) => yahooExpiryToBullflowKey(ts) === bullflowExpiration,
  );

  if (!matchTs) {
    throw new Error(
      `Expiration ${bullflowExpiration} not found in options chain for ${resolved.display}`,
    );
  }

  const chain = await fetchOptionsChain(optionsSymbol, matchTs);
  if (!chain.calls.length && !chain.puts.length) {
    throw new Error(`No options contracts for ${resolved.display} exp ${bullflowExpiration}`);
  }

  return {
    ...chain,
    matchedExpiration: bullflowExpiration,
    expirationUnix: matchTs,
  };
}