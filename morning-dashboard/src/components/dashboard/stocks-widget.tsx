"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import type { StockData } from "@/types";

function getMarketStatusLabel(state: string): { label: string; variant: "default" | "success" | "warning" | "outline" } {
  switch (state) {
    case "PRE": return { label: "Pre-Market", variant: "warning" };
    case "REGULAR": return { label: "Market Open", variant: "success" };
    case "POST": return { label: "After Hours", variant: "warning" };
    default: return { label: "Market Closed", variant: "outline" };
  }
}

export function StocksWidget({ symbols }: { symbols: string[] }) {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await fetch(`/api/stocks?symbols=${symbols.join(",")}`);
        if (!res.ok) throw new Error("Failed to fetch stocks");
        const stocks = await res.json();
        setData(stocks);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stocks");
      } finally {
        setLoading(false);
      }
    }
    fetchStocks();
  }, [symbols]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-terracotta" />
            Markets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-terracotta" />
            Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300/70 text-sm">{error || "Unable to load stock data"}</p>
        </CardContent>
      </Card>
    );
  }

  const marketStatus = getMarketStatusLabel(data[0]?.marketState || "CLOSED");

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sand flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-terracotta" />
            Markets
          </span>
          <Badge variant={marketStatus.variant}>{marketStatus.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((stock) => {
            const isPositive = stock.change >= 0;
            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
              >
                <span className="font-medium text-sand text-sm">{stock.symbol}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-sand/80 font-mono">
                    ${stock.price.toFixed(2)}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
