"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Droplets,
  Wind,
  Thermometer,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { WeatherData } from "@/types";

const weatherIcons: Record<string, React.ElementType> = {
  Clear: Sun,
  "Partly Cloudy": Cloud,
  Cloudy: Cloud,
  Fog: CloudFog,
  Drizzle: CloudDrizzle,
  Rain: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: CloudLightning,
};

function WeatherIcon({ description, className }: { description: string; className?: string }) {
  const Icon = weatherIcons[description] || Cloud;
  return <Icon className={className} />;
}

interface WeatherWidgetProps {
  location: { lat: number; lng: number; name: string };
  onLocationChange: (location: { lat: number; lng: number; name: string }) => void;
}

export function WeatherWidget({ location, onLocationChange }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      try {
        const res = await fetch(`/api/weather?lat=${location.lat}&lng=${location.lng}`);
        if (!res.ok) throw new Error("Failed to fetch weather");
        const weather = await res.json();
        setData(weather);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load weather");
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [location.lat, location.lng]);

  async function handleLocationSubmit() {
    if (!editValue.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(editValue.trim())}`);
      if (!res.ok) throw new Error("Location not found");
      const geo = await res.json();
      onLocationChange({ lat: geo.lat, lng: geo.lng, name: editValue.trim() });
      setEditing(false);
    } catch {
      // keep editing open on failure
    } finally {
      setGeocoding(false);
    }
  }

  if (loading && !data) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Sun className="h-5 w-5 text-terracotta" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Sun className="h-5 w-5 text-terracotta" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300/70 text-sm">{error || "Unable to load weather data"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sand flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-terracotta" />
            Weather
          </span>
          <div className="flex items-center gap-1">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLocationSubmit()}
                  placeholder="City or address"
                  className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs text-sand w-32 focus:outline-none focus:border-terracotta"
                  autoFocus
                  disabled={geocoding}
                />
                <button onClick={handleLocationSubmit} disabled={geocoding} className="p-0.5 hover:bg-white/10 rounded">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                </button>
                <button onClick={() => setEditing(false)} className="p-0.5 hover:bg-white/10 rounded">
                  <X className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <Badge variant="outline" className="text-xs font-normal">{location.name}</Badge>
                <button
                  onClick={() => { setEditValue(location.name); setEditing(true); }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Pencil className="h-3 w-3 text-sand/50" />
                </button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <WeatherIcon
              description={data.description}
              className="h-12 w-12 text-terracotta"
            />
            <div>
              <p className="text-4xl font-bold text-sand">{Math.round(data.temperature)}°F</p>
              <p className="text-sm text-sand/60">{data.description}</p>
            </div>
          </div>
          <div className="text-right text-sm text-sand/60 space-y-1">
            <p className="flex items-center gap-1 justify-end">
              <Thermometer className="h-3.5 w-3.5" />
              Feels {Math.round(data.feelsLike)}°F
            </p>
            <p className="flex items-center gap-1 justify-end">
              <Droplets className="h-3.5 w-3.5" />
              {data.humidity}%
            </p>
            <p className="flex items-center gap-1 justify-end">
              <Wind className="h-3.5 w-3.5" />
              {Math.round(data.windSpeed)} mph
            </p>
          </div>
        </div>

        {/* 5-day forecast */}
        <div className="flex gap-2 pt-3 border-t border-white/10">
          {data.daily.slice(0, 5).map((day) => (
            <div key={day.date} className="flex-1 text-center">
              <p className="text-xs text-sand/50 mb-1">
                {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <WeatherIcon description={day.description} className="h-4 w-4 mx-auto text-sand/60 mb-1" />
              <p className="text-xs text-sand/80">{Math.round(day.tempMax)}°</p>
              <p className="text-xs text-sand/40">{Math.round(day.tempMin)}°</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
