"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Clock, MapPin } from "lucide-react";
import type { CommuteData } from "@/types";

function getCommuteColor(minutes: number): string {
  if (minutes < 20) return "text-emerald-400";
  if (minutes < 40) return "text-amber-400";
  return "text-red-400";
}

function getCommuteBadge(minutes: number): { variant: "success" | "warning" | "destructive"; label: string } {
  if (minutes < 20) return { variant: "success", label: "Light" };
  if (minutes < 40) return { variant: "warning", label: "Moderate" };
  return { variant: "destructive", label: "Heavy" };
}

export function CommuteWidget({
  home,
  work,
}: {
  home: { lat: number; lng: number; name: string };
  work: { lat: number; lng: number; name: string };
}) {
  const [data, setData] = useState<CommuteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommute() {
      try {
        const res = await fetch(
          `/api/commute?homeLat=${home.lat}&homeLng=${home.lng}&workLat=${work.lat}&workLng=${work.lng}`
        );
        if (!res.ok) throw new Error("Failed to fetch commute");
        const commute = await res.json();
        setData(commute);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load commute data");
      } finally {
        setLoading(false);
      }
    }
    fetchCommute();
  }, [home.lat, home.lng, work.lat, work.lng]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Car className="h-5 w-5 text-terracotta" />
            Commute
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Car className="h-5 w-5 text-terracotta" />
            Commute
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300/70 text-sm">{error || "Unable to load commute data"}</p>
        </CardContent>
      </Card>
    );
  }

  const minutes = Math.round(data.duration);
  const badge = getCommuteBadge(minutes);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sand flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Car className="h-5 w-5 text-terracotta" />
            Commute
          </span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-2">
          <p className={`text-5xl font-bold ${getCommuteColor(minutes)}`}>
            {minutes}
          </p>
          <p className="text-sand/60 text-sm mt-1">minutes</p>
        </div>

        <div className="mt-4 space-y-2 text-sm text-sand/60">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-sage" />
            <span>{home.name}</span>
            <span className="text-sand/30">→</span>
            <span>{work.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-sage" />
            <span>{(data.distance / 1609.34).toFixed(1)} miles</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
