"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import type { NewsSummary, GdeltArticle } from "@/types";

interface NewsData extends NewsSummary {
  sources?: GdeltArticle[];
}

export function NewsWidget({ topics }: { topics: string[] }) {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchNews(forceRefresh = false) {
    try {
      const refreshParam = forceRefresh ? "&refresh=true" : "";
      const res = await fetch(`/api/news?topics=${encodeURIComponent(topics.join(","))}${refreshParam}`);
      if (!res.ok) throw new Error("Failed to fetch news summary");
      const news = await res.json();
      setData(news);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.join(",")]);

  function handleRefresh() {
    setRefreshing(true);
    fetchNews(true);
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-terracotta" />
            Morning Briefing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sand flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-terracotta" />
              Morning Briefing
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300/70 text-sm">{error || "Unable to load news summary"}</p>
          <p className="text-sand/40 text-xs mt-2">
            Requires ANTHROPIC_API_KEY to be set in .env.local
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sand flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-terracotta" />
            Morning Briefing
          </span>
          <div className="flex items-center gap-2">
            {data.topics.map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
            ))}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-sand/60 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="text-sm text-sand/80 leading-relaxed prose prose-invert prose-sm max-w-none
            [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-2
            [&_li]:text-sand/80
            [&_strong]:text-sand [&_strong]:font-semibold
            [&_h3]:text-sand [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1"
          dangerouslySetInnerHTML={{ __html: data.summary }}
        />

        {/* Source articles from GDELT */}
        {data.sources && data.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-xs text-sand/40 mb-2 font-medium">Sources</p>
            <div className="space-y-1.5">
              {data.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 text-xs text-sand/50 hover:text-terracotta transition-colors group"
                >
                  <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="line-clamp-1">
                    <span className="text-sand/30">{source.source}</span>
                    {" — "}
                    {source.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-sand/30 mt-4">
          Generated at {new Date(data.generatedAt).toLocaleTimeString()}
          {data.sources && data.sources.length > 0 && " • Powered by GDELT + Claude"}
        </p>
      </CardContent>
    </Card>
  );
}
