"use client";

import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { CommuteWidget } from "@/components/dashboard/commute-widget";
import { StocksWidget } from "@/components/dashboard/stocks-widget";
import { SurfWidget } from "@/components/dashboard/surf-widget";
import { SpotifyWidget } from "@/components/dashboard/spotify-widget";
import { NewsWidget } from "@/components/dashboard/news-widget";
import { DEFAULT_SETTINGS } from "@/types";

export default function Home() {
  const settings = DEFAULT_SETTINGS;

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <GreetingHeader userName={settings.userName} />

        {/* Top row: Weather, Commute, Stocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WeatherWidget location={settings.location} />
          <CommuteWidget
            home={settings.location}
            work={settings.workLocation}
          />
          <StocksWidget symbols={settings.stocks} />
        </div>

        {/* Middle row: Surf, Spotify */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SurfWidget spots={settings.surfSpots} />
          <SpotifyWidget />
        </div>

        {/* Bottom row: News (full width) */}
        <NewsWidget topics={settings.newsTopics} />
      </div>
    </main>
  );
}
