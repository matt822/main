import { cookies } from "next/headers";

async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

  if (!refreshToken) return null;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) return null;

    const tokens = await res.json();

    cookieStore.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expires_in,
      path: "/",
    });

    if (tokens.refresh_token) {
      cookieStore.set("spotify_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return tokens.access_token;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (accessToken) return accessToken;

  return refreshAccessToken();
}

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (res.status === 204) {
      return Response.json({ track: null });
    }

    if (res.status === 401) {
      // Try refreshing
      const newToken = await refreshAccessToken();
      if (!newToken) {
        return Response.json({ error: "Not authenticated" }, { status: 401 });
      }

      const retryRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${newToken}` },
        cache: "no-store",
      });

      if (retryRes.status === 204) {
        return Response.json({ track: null });
      }

      if (!retryRes.ok) throw new Error("Retry failed");

      const data = await retryRes.json();
      return Response.json({
        track: data.item
          ? {
              name: data.item.name,
              artist: data.item.artists.map((a: { name: string }) => a.name).join(", "),
              album: data.item.album.name,
              albumArt: data.item.album.images[0]?.url || "",
              isPlaying: data.is_playing,
              progressMs: data.progress_ms,
              durationMs: data.item.duration_ms,
            }
          : null,
      });
    }

    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);

    const data = await res.json();

    return Response.json({
      track: data.item
        ? {
            name: data.item.name,
            artist: data.item.artists.map((a: { name: string }) => a.name).join(", "),
            album: data.item.album.name,
            albumArt: data.item.album.images[0]?.url || "",
            isPlaying: data.is_playing,
            progressMs: data.progress_ms,
            durationMs: data.item.duration_ms,
          }
        : null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch now playing" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    let endpoint = "";
    let method = "PUT";

    switch (action) {
      case "play":
        endpoint = "https://api.spotify.com/v1/me/player/play";
        break;
      case "pause":
        endpoint = "https://api.spotify.com/v1/me/player/pause";
        break;
      case "next":
        endpoint = "https://api.spotify.com/v1/me/player/next";
        method = "POST";
        break;
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const res = await fetch(endpoint, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`Spotify control error: ${res.status}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to control playback" },
      { status: 500 }
    );
  }
}
