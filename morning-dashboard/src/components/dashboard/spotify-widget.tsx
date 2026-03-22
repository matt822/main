"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Play, Pause, SkipForward, ExternalLink } from "lucide-react";
import type { SpotifyTrack } from "@/types";

export function SpotifyWidget() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSpotify() {
      try {
        const res = await fetch("/api/spotify/now-playing");
        if (res.status === 401) {
          setConnected(false);
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setTrack(data.track || null);
          setConnected(true);
        }
      } catch {
        setConnected(false);
      } finally {
        setLoading(false);
      }
    }
    checkSpotify();
  }, []);

  async function handlePlayPause() {
    if (!track) return;
    try {
      await fetch("/api/spotify/now-playing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: track.isPlaying ? "pause" : "play" }),
      });
      setTrack({ ...track, isPlaying: !track.isPlaying });
    } catch {
      // ignore
    }
  }

  async function handleSkip() {
    try {
      await fetch("/api/spotify/now-playing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next" }),
      });
      // Refresh after a short delay
      setTimeout(async () => {
        const res = await fetch("/api/spotify/now-playing");
        if (res.ok) {
          const data = await res.json();
          setTrack(data.track || null);
        }
      }, 500);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Music className="h-5 w-5 text-terracotta" />
            Spotify
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Music className="h-5 w-5 text-terracotta" />
            Spotify
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Music className="h-12 w-12 text-sand/20 mx-auto mb-3" />
            <p className="text-sand/60 text-sm mb-4">Connect your Spotify account to see what&apos;s playing</p>
            <a
              href="/api/spotify/auth"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30 transition-colors text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Connect Spotify
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sand flex items-center gap-2">
          <Music className="h-5 w-5 text-terracotta" />
          Spotify
        </CardTitle>
      </CardHeader>
      <CardContent>
        {track ? (
          <div className="flex items-center gap-4">
            {track.albumArt && (
              <img
                src={track.albumArt}
                alt={track.album}
                className="w-16 h-16 rounded-lg shadow-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sand truncate">{track.name}</p>
              <p className="text-sm text-sand/60 truncate">{track.artist}</p>
              <p className="text-xs text-sand/40 truncate">{track.album}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                {track.isPlaying ? (
                  <Pause className="h-5 w-5 text-sand" />
                ) : (
                  <Play className="h-5 w-5 text-sand" />
                )}
              </button>
              <button
                onClick={handleSkip}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <SkipForward className="h-5 w-5 text-sand" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sand/60 text-sm">Nothing playing right now</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
