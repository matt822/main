export async function GET() {
  try {
    const res = await fetch("http://ip-api.com/json/?fields=lat,lon,city,regionName,country", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`ip-api error: ${res.status}`);

    const json = await res.json();

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
