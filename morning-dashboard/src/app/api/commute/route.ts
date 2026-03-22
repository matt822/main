import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const homeLat = searchParams.get("homeLat") || "34.0195";
  const homeLng = searchParams.get("homeLng") || "-118.4912";
  const workLat = searchParams.get("workLat") || "34.0522";
  const workLng = searchParams.get("workLng") || "-118.2437";

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${homeLng},${homeLat};${workLng},${workLat}?overview=false`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`OSRM API error: ${res.status}`);

    const json = await res.json();

    if (json.code !== "Ok" || !json.routes?.length) {
      throw new Error("No route found");
    }

    const route = json.routes[0];

    return Response.json({
      duration: route.duration / 60, // convert seconds to minutes
      distance: route.distance, // meters
      summary: "via fastest route",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch commute" },
      { status: 500 }
    );
  }
}
