import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol") || "SPY";
  const interval = searchParams.get("interval") || "5m";
  const range = searchParams.get("range") || "1d";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Yahoo Finance chart error: ${res.status}`);

    const json = await res.json();
    const result = json.chart?.result?.[0];

    if (!result) {
      return Response.json({ error: "No chart data" }, { status: 404 });
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    const candles = timestamps.map((time: number, i: number) => ({
      time,
      open: quote.open?.[i] ?? 0,
      high: quote.high?.[i] ?? 0,
      low: quote.low?.[i] ?? 0,
      close: quote.close?.[i] ?? 0,
      volume: quote.volume?.[i] ?? 0,
    })).filter((c: { open: number }) => c.open !== 0);

    return Response.json({
      symbol: result.meta?.symbol || symbol,
      candles,
      marketState: result.meta?.marketState || "CLOSED",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
