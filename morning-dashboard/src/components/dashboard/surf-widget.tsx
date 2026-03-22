"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Waves, Wind, ArrowUp, MapPin } from "lucide-react";
import type { SurfData, SurfSpot } from "@/types";

function getRatingColor(rating: string): "success" | "warning" | "destructive" | "default" | "outline" {
  switch (rating) {
    case "Epic": return "success";
    case "Good": return "success";
    case "Fair": return "warning";
    case "Poor": return "destructive";
    default: return "outline";
  }
}

function getDirectionLabel(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

interface SurfWidgetProps {
  spots: SurfSpot[];
  location: { lat: number; lng: number; name: string };
}

export function SurfWidget({ spots, location }: SurfWidgetProps) {
  const [data, setData] = useState<SurfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSurf() {
      try {
        const spotsParam = spots.map((s) => `${s.name}:${s.lat}:${s.lng}`).join(",");
        const res = await fetch(`/api/surf?spots=${encodeURIComponent(spotsParam)}`);
        if (!res.ok) throw new Error("Failed to fetch surf data");
        const surfData = await res.json();
        setData(surfData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load surf forecast");
      } finally {
        setLoading(false);
      }
    }
    fetchSurf();
  }, [spots]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Waves className="h-5 w-5 text-terracotta" />
            Surf Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
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
            <Waves className="h-5 w-5 text-terracotta" />
            Surf Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300/70 text-sm">{error || "Unable to load surf data"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sand flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-terracotta" />
            Surf Forecast
          </span>
          <span className="flex items-center gap-1 text-xs text-sand/40 font-normal">
            <MapPin className="h-3 w-3" />
            {location.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((spot) => (
            <div
              key={spot.spot}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div>
                <p className="font-medium text-sand text-sm">{spot.spot}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-sand/50">
                  <span className="flex items-center gap-1">
                    <Waves className="h-3 w-3" />
                    {spot.waveHeight.toFixed(1)}ft @ {spot.wavePeriod.toFixed(0)}s
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowUp
                      className="h-3 w-3"
                      style={{ transform: `rotate(${spot.waveDirection}deg)` }}
                    />
                    {getDirectionLabel(spot.waveDirection)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="h-3 w-3" />
                    {Math.round(spot.windSpeed)} mph
                  </span>
                </div>
              </div>
              <Badge variant={getRatingColor(spot.rating)}>{spot.rating}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
