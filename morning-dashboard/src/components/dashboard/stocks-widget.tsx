"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, BarChart3, Plus, X, ChevronDown } from "lucide-react";
import { StockChart } from "./stock-chart";
import type { StockData } from "@/types";

function getMarketStatusLabel(state: string): { label: string; variant: "default" | "success" | "warning" | "outline" } {
  switch (state) {
    case "PRE": return { label: "Pre-Market", variant: "warning" };
    case "REGULAR": return { label: "Market Open", variant: "success" };
    case "POST": return { label: "After Hours", variant: "warning" };
    default: return { label: "Market Closed", variant: "outline" };
  }
}

function getFreshnessColor(lastFetched: number | null): { dot: string; label: string } {
  if (!lastFetched) return { dot: "bg-gray-400", label: "" };
  const ageMin = (Date.now() - lastFetched) / 60000;
  if (ageMin < 2) return { dot: "bg-emerald-400 animate-pulse", label: "Live" };
  if (ageMin < 10) return { dot: "bg-amber-400", label: `${Math.round(ageMin)}m ago` };
  return { dot: "bg-red-400", label: `${Math.round(ageMin)}m ago` };
}

function isMarketHours(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const h = et.getHours();
  const m = et.getMinutes();
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = h * 60 + m;
  return mins >= 570 && mins <= 960; // 9:30am - 4:00pm ET
}

interface StocksWidgetProps {
  symbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
}

export function StocksWidget({ symbols, onSymbolsChange }: StocksWidgetProps) {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [newTicker, setNewTicker] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch(`/api/stocks?symbols=${symbols.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch stocks");
      const stocks = await res.json();
      setData(stocks);
      setLastFetched(Date.now());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stocks");
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const interval = isMarketHours() ? 60_000 : 300_000;
    intervalRef.current = setInterval(fetchStocks, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStocks]);

  async function handleAddTicker() {
    const ticker = newTicker.trim().toUpperCase();
    if (!ticker) return;
    if (symbols.includes(ticker)) {
      setAddError("Already tracked");
      return;
    }

    setAddError(null);
    try {
      // Validate by fetching
      const res = await fetch(`/api/stocks?symbols=${ticker}`);
      if (!res.ok) throw new Error();
      const stocks = await res.json();
      if (!stocks.length || stocks[0].price === 0) throw new Error();

      onSymbolsChange([...symbols, ticker]);
      setNewTicker("");
    } catch {
      setAddError("Invalid ticker");
    }
  }

  function handleRemoveTicker(symbol: string) {
    onSymbolsChange(symbols.filter((s) => s !== symbol));
    if (expandedSymbol === symbol) setExpandedSymbol(null);
  }

  const freshness = getFreshnessColor(lastFetched);

  if (loading && data.length === 0) {
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

  if (error && data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-terracotta" />
            Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300/70 text-sm">{error}</p>
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
          <div className="flex items-center gap-2">
            {/* Freshness indicator */}
            <span className="flex items-center gap-1.5 text-xs text-sand/40">
              <span className={`h-2 w-2 rounded-full ${freshness.dot}`} />
              {freshness.label}
            </span>
            <Badge variant={marketStatus.variant}>
              {marketStatus.variant === "success" && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse mr-1.5" />
              )}
              {marketStatus.label}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {data.map((stock) => {
            const isPositive = stock.change >= 0;
            const isExpanded = expandedSymbol === stock.symbol;
            return (
              <div key={stock.symbol}>
                <div
                  className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 -mx-1 px-1 rounded group"
                  onClick={() => setExpandedSymbol(isExpanded ? null : stock.symbol)}
                >
                  <span className="flex items-center gap-2">
                    <ChevronDown className={`h-3 w-3 text-sand/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    <span className="font-medium text-sand text-sm">{stock.symbol}</span>
                  </span>
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
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveTicker(stock.symbol); }}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
                    >
                      <X className="h-3 w-3 text-sand/40" />
                    </button>
                  </div>
                </div>
                {isExpanded && <StockChart symbol={stock.symbol} />}
              </div>
            );
          })}
        </div>

        {/* Add ticker */}
        <div className="mt-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => { setNewTicker(e.target.value.toUpperCase()); setAddError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
              placeholder="Add ticker..."
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-sand flex-1 min-w-0 focus:outline-none focus:border-terracotta placeholder:text-sand/30"
              maxLength={10}
            />
            <button
              onClick={handleAddTicker}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Plus className="h-4 w-4 text-terracotta" />
            </button>
          </div>
          {addError && <p className="text-red-300/60 text-xs mt-1">{addError}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
