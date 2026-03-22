import { NextRequest } from "next/server";

// Simple in-memory cache
let cachedNews: { summary: string; topics: string[]; generatedAt: string } | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const topicsParam = searchParams.get("topics") || "geopolitics,technology,financial markets";
  const topics = topicsParam.split(",").map((t) => t.trim());

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Check cache
  if (cachedNews && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return Response.json(cachedNews);
  }

  try {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
            content: `Today is ${today}. Please provide a concise morning briefing covering the most important developments in the last 24 hours across these topics: ${topics.join(", ")}.

Format your response as HTML with:
- Use <h3> tags for topic sections
- Use <ul> and <li> tags for bullet points
- Use <strong> for emphasis on key facts
- Keep it concise — aim for 3-5 bullet points per topic
- Focus on actionable intelligence and key developments
- Include market-relevant insights where applicable`,
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
