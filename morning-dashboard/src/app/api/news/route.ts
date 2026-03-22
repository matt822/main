import { NextRequest } from "next/server";

interface GdeltArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

// Simple in-memory cache
let cachedNews: { summary: string; topics: string[]; generatedAt: string; sources: GdeltArticle[] } | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchGdeltArticles(topics: string[]): Promise<GdeltArticle[]> {
  const query = topics
    .map((t) => `"${t}"`)
    .join(" OR ");

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=20&format=json&timespan=24h&sort=DateDesc`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const json = await res.json();
    const articles = json.articles || [];

    return articles.slice(0, 15).map((a: { title: string; url: string; source: string; seendate: string }) => ({
      title: a.title || "",
      url: a.url || "",
      source: a.source || "",
      publishedAt: a.seendate || "",
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const topicsParam = searchParams.get("topics") || "geopolitics,technology,financial markets";
  const topics = topicsParam.split(",").map((t) => t.trim());
  const forceRefresh = searchParams.get("refresh") === "true";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Check cache (skip if force refresh)
  if (!forceRefresh && cachedNews && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return Response.json(cachedNews);
  }

  try {
    // Step 1: Fetch real articles from GDELT
    const articles = await fetchGdeltArticles(topics);

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Step 2: Build prompt with real article context
    let articleContext = "";
    if (articles.length > 0) {
      articleContext = `\n\nHere are real headlines from the last 24 hours to inform your summary:\n${articles
        .map((a, i) => `${i + 1}. "${a.title}" (${a.source})`)
        .join("\n")}`;
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Today is ${today}. Please provide a concise morning briefing covering the most important developments in the last 24 hours across these topics: ${topics.join(", ")}.${articleContext}

Format your response as HTML with:
- Use <h3> tags for topic sections
- Use <ul> and <li> tags for bullet points
- Use <strong> for emphasis on key facts
- Keep it concise — aim for 3-5 bullet points per topic
- Focus on actionable intelligence and key developments
- Include market-relevant insights where applicable
- Reference specific sources when available`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error: ${res.status} - ${errBody}`);
    }

    const json = await res.json();
    const summary = json.content[0]?.text || "No summary available";

    const result = {
      summary,
      topics,
      generatedAt: new Date().toISOString(),
      sources: articles.slice(0, 8),
    };

    // Update cache
    cachedNews = result;
    cacheTimestamp = Date.now();

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate news summary" },
      { status: 500 }
    );
  }
}
