import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Forward client IP for production (edge/CDN) deployments
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipPath = clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1" ? `/${clientIp}` : "";

    const res = await fetch(`http://ip-api.com/json${ipPath}?fields=lat,lon,city,regionName,country`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`ip-api error: ${res.status}`);

    const json = await res.json();

    if (json.status === "fail") {
      throw new Error(json.message || "Geolocation lookup failed");
    }

    return Response.json({
      lat: json.lat,
      lng: json.lon,
      city: json.city,
      region: json.regionName,
      country: json.country,
      name: `${json.city}, ${json.regionName}`,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Geolocation failed" },
      { status: 500 }
    );
  }
}
