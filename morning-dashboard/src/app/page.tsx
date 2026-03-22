"use client";

import { useEffect } from "react";
import { SettingsProvider, useSettings } from "@/lib/use-settings";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { CommuteWidget } from "@/components/dashboard/commute-widget";
import { StocksWidget } from "@/components/dashboard/stocks-widget";
import { SurfWidget } from "@/components/dashboard/surf-widget";
import { SpotifyWidget } from "@/components/dashboard/spotify-widget";
import { NewsWidget } from "@/components/dashboard/news-widget";

function Dashboard() {
  const { settings, updateSettings, isLoaded } = useSettings();

  useEffect(() => {
    if (!isLoaded) return;

    // On first load with no saved location, auto-detect via IP
    const hasCustomLocation = (() => {
      try {
        const stored = localStorage.getItem("dashboard-settings");
        return stored && JSON.parse(stored).location;
      } catch {
        return false;
      }
    })();

    if (!hasCustomLocation) {
      fetch("/api/geolocation")
        .then((res) => (res.ok ? res.json() : null))
        .then((geo) => {
          if (geo?.lat && geo?.lng) {
            updateSettings({
              location: { lat: geo.lat, lng: geo.lng, name: geo.name },
            });
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, updateSettings]);

  if (!isLoaded) {
    return (
      <main className="min-h-screen p-6 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <GreetingHeader userName={settings.userName} />

        {/* Top row: Weather, Commute, Stocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WeatherWidget
            location={settings.location}
            onLocationChange={(location) => updateSettings({ location })}
          />
          <CommuteWidget
            home={settings.location}
            work={settings.workLocation}
            onWorkChange={(workLocation) => updateSettings({ workLocation })}
          />
          <StocksWidget
            symbols={settings.stocks}
            onSymbolsChange={(stocks) => updateSettings({ stocks })}
          />
        </div>

        {/* Middle row: Surf, Spotify */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SurfWidget spots={settings.surfSpots} location={settings.location} />
          <SpotifyWidget />
        </div>

        {/* Bottom row: News (full width) */}
        <NewsWidget topics={settings.newsTopics} />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <SettingsProvider>
      <Dashboard />
    </SettingsProvider>
  );
}
