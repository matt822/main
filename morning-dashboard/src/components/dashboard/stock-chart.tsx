"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockCandle } from "@/types";

interface StockChartProps {
  symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      if (!chartContainerRef.current) return;

      try {
        const [{ createChart, CandlestickSeries, HistogramSeries }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(`/api/stocks/chart?symbol=${symbol}&interval=5m&range=1d`),
        ]);

        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to load chart");

        const data = await res.json();
        const candles: StockCandle[] = data.candles || [];

        if (!candles.length) {
          setError("No chart data available");
          setLoading(false);
          return;
        }

        // Clean up previous chart
        if (chartRef.current) {
          chartRef.current.remove();
        }

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 200,
          layout: {
            background: { color: "transparent" },
            textColor: "#E8DCC8",
            fontSize: 10,
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.05)" },
            horzLines: { color: "rgba(255,255,255,0.05)" },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: "rgba(255,255,255,0.1)",
          },
          rightPriceScale: {
            borderColor: "rgba(255,255,255,0.1)",
          },
          crosshair: {
            vertLine: { color: "rgba(194,112,62,0.4)" },
            horzLine: { color: "rgba(194,112,62,0.4)" },
          },
        });

        chartRef.current = chart;

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#6B7F3B",
          downColor: "#C2703E",
          borderUpColor: "#6B7F3B",
          borderDownColor: "#C2703E",
          wickUpColor: "#6B7F3B",
          wickDownColor: "#C2703E",
        });

        const chartData = candles.map((c) => ({
          time: c.time as import("lightweight-charts").UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        candleSeries.setData(chartData);

        // Volume histogram
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        });

        chart.priceScale("volume").applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });

        volumeSeries.setData(
          candles.map((c) => ({
            time: c.time as import("lightweight-charts").UTCTimestamp,
            value: c.volume,
            color: c.close >= c.open ? "rgba(107,127,59,0.3)" : "rgba(194,112,62,0.3)",
          }))
        );

        chart.timeScale().fitContent();

        // Resize observer
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            chart.applyOptions({ width: entry.contentRect.width });
          }
        });
        ro.observe(chartContainerRef.current);

        setLoading(false);

        return () => {
          ro.disconnect();
        };
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Chart error");
          setLoading(false);
        }
      }
    }

    loadChart();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol]);

  if (error) {
    return <p className="text-red-300/60 text-xs py-2">{error}</p>;
  }

  return (
    <div className="mt-2 pb-1">
      {loading && <Skeleton className="h-[200px] w-full" />}
      <div ref={chartContainerRef} className={loading ? "hidden" : ""} />
    </div>
  );
}
