"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Clock, MapPin, Pencil, Check, X } from "lucide-react";
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

interface CommuteWidgetProps {
  home: { lat: number; lng: number; name: string };
  work: { lat: number; lng: number; name: string };
  onWorkChange: (work: { lat: number; lng: number; name: string }) => void;
}

export function CommuteWidget({ home, work, onWorkChange }: CommuteWidgetProps) {
  const [data, setData] = useState<CommuteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    async function fetchCommute() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/commute?homeLat=${home.lat}&homeLng=${home.lng}&workLat=${work.lat}&workLng=${work.lng}`
        );
        if (!res.ok) throw new Error("Failed to fetch commute");
        const commute = await res.json();
        setData(commute);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load commute data");
      } finally {
        setLoading(false);
      }
    }
    fetchCommute();
  }, [home.lat, home.lng, work.lat, work.lng]);

  async function handleDestinationSubmit() {
    if (!editValue.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(editValue.trim())}`);
      if (!res.ok) throw new Error("Address not found");
      const geo = await res.json();
      onWorkChange({ lat: geo.lat, lng: geo.lng, name: editValue.trim() });
      setEditing(false);
    } catch {
      // keep editing open
    } finally {
      setGeocoding(false);
    }
  }

  if (loading && !data) {
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
            <MapPin className="h-3.5 w-3.5 text-sage shrink-0" />
            <span className="truncate">{home.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sand/30 ml-1.5">↓</span>
          </div>

          <div className="flex items-center gap-2 group">
            <MapPin className="h-3.5 w-3.5 text-terracotta shrink-0" />
            {editing ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDestinationSubmit()}
                  placeholder="Destination address"
                  className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs text-sand flex-1 min-w-0 focus:outline-none focus:border-terracotta"
                  autoFocus
                  disabled={geocoding}
                />
                <button onClick={handleDestinationSubmit} disabled={geocoding} className="p-0.5 hover:bg-white/10 rounded shrink-0">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                </button>
                <button onClick={() => setEditing(false)} className="p-0.5 hover:bg-white/10 rounded shrink-0">
                  <X className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <span className="truncate">{work.name}</span>
                <button
                  onClick={() => { setEditValue(work.name); setEditing(true); }}
                  className="p-0.5 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Pencil className="h-3 w-3 text-sand/50" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-sage shrink-0" />
            <span>{(data.distance / 1609.34).toFixed(1)} miles</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
