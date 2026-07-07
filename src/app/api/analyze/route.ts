import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analyze";
import { isValidSymbol } from "@/lib/symbols";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "SPY";
  const expiration = searchParams.get("expiration") ?? "all";

  if (!isValidSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }

  if (expiration !== "all" && !/^\d{8}$/.test(expiration)) {
    return NextResponse.json({ error: "Invalid expiration format" }, { status: 400 });
  }

  try {
    const report = await runAnalysis(symbol, expiration);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 },
    );
  }
}