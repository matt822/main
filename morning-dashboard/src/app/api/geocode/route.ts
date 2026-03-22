import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address");

  if (!address) {
    return Response.json({ error: "address parameter is required" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "MorningDashboard/1.0",
      },
      next: { revalidate: 86400 }, // cache geocode results for 24h
    });

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

    const results = await res.json();

    if (!results.length) {
      return Response.json({ error: "Address not found" }, { status: 404 });
    }

    const result = results[0];
    return Response.json({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Geocoding failed" },
      { status: 500 }
    );
  }
}
