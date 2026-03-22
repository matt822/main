import { NextRequest } from "next/server";

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  marketState: string;
  preMarketPrice?: number;
  preMarketChange?: number;
  preMarketChangePercent?: number;
  postMarketPrice?: number;
  postMarketChange?: number;
  postMarketChangePercent?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbols = searchParams.get("symbols") || "SPY,QQQ,AAPL,TSLA";
  const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase());

  try {
    // Use Yahoo Finance v6 quote endpoint
    const url = `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${symbolList.join(",")}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      // Fallback: try v8 chart endpoint for individual symbols
      const stocks = await Promise.all(
        symbolList.map(async (symbol) => {
          try {
            const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
            const chartRes = await fetch(chartUrl, {
              headers: { "User-Agent": "Mozilla/5.0" },
              next: { revalidate: 60 },
            });

            if (!chartRes.ok) throw new Error("Chart API failed");

            const chartJson = await chartRes.json();
            const meta = chartJson.chart.result[0].meta;

            return {
              symbol,
              price: meta.regularMarketPrice,
              change: meta.regularMarketPrice - meta.chartPreviousClose,
              changePercent:
                ((meta.regularMarketPrice - meta.chartPreviousClose) /
                  meta.chartPreviousClose) *
                100,
              previousClose: meta.chartPreviousClose,
              marketState: meta.marketState || "CLOSED",
            };
          } catch {
            return {
              symbol,
              price: 0,
              change: 0,
              changePercent: 0,
              previousClose: 0,
              marketState: "CLOSED",
            };
          }
        })
      );

      return Response.json(stocks);
    }

    const json = await res.json();
    const quotes: YahooQuote[] = json.quoteResponse?.result || [];

    const stocks = quotes.map((q) => {
      const isPreMarket = q.marketState === "PRE" && q.preMarketPrice;
      const isPostMarket = q.marketState === "POST" && q.postMarketPrice;

      let price = q.regularMarketPrice;
      let change = q.regularMarketChange;
      let changePercent = q.regularMarketChangePercent;

      if (isPreMarket) {
        price = q.preMarketPrice!;
        change = q.preMarketChange || 0;
        changePercent = q.preMarketChangePercent || 0;
      } else if (isPostMarket) {
        price = q.postMarketPrice!;
        change = q.postMarketChange || 0;
        changePercent = q.postMarketChangePercent || 0;
      }

      return {
        symbol: q.symbol,
        price,
        change,
        changePercent,
        previousClose: q.regularMarketPreviousClose,
        marketState: q.marketState || "CLOSED",
      };
    });

    return Response.json(stocks);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}
