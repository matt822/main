import { NextRequest } from "next/server";

type SurfRating = "Flat" | "Poor" | "Fair" | "Good" | "Epic";

function calculateSurfRating(waveHeight: number, wavePeriod: number, windSpeed: number): SurfRating {
  // Wave height in feet
  if (waveHeight < 1) return "Flat";
  if (waveHeight < 2 && wavePeriod < 8) return "Poor";

  let score = 0;

  // Wave height scoring
  if (waveHeight >= 4) score += 3;
  else if (waveHeight >= 2.5) score += 2;
  else if (waveHeight >= 1.5) score += 1;

  // Period scoring (longer period = better formed waves)
  if (wavePeriod >= 14) score += 3;
  else if (wavePeriod >= 10) score += 2;
  else if (wavePeriod >= 7) score += 1;

  // Wind penalty (high wind = choppy)
  if (windSpeed > 20) score -= 2;
  else if (windSpeed > 12) score -= 1;

  if (score >= 5) return "Epic";
  if (score >= 3) return "Good";
  if (score >= 1) return "Fair";
  return "Poor";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const spotsParam = searchParams.get("spots") || "";

  const spots = spotsParam.split(",").map((s) => {
    const [name, lat, lng] = s.split(":");
    return { name, lat: parseFloat(lat), lng: parseFloat(lng) };
  });

  if (spots.length === 0 || !spots[0].name) {
    return Response.json({ error: "No surf spots provided" }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      spots.map(async (spot) => {
        const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lng}&current=wave_height,wave_period,wave_direction,wind_wave_height,wind_wave_period&hourly=wave_height,wave_period&length_unit=imperial&wind_speed_unit=mph&timezone=auto&forecast_days=1`;

        const res = await fetch(url, { next: { revalidate: 1800 } });
        if (!res.ok) throw new Error(`Marine API error for ${spot.name}`);

        const json = await res.json();
        const current = json.current;

        // Get wind speed from weather API for this location
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lng}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=mph`;
        const weatherRes = await fetch(weatherUrl, { next: { revalidate: 1800 } });
        const weatherJson = weatherRes.ok ? await weatherRes.json() : null;

        const windSpeed = weatherJson?.current?.wind_speed_10m || 0;
        const windDirection = weatherJson?.current?.wind_direction_10m || 0;
        const waveHeight = current.wave_height || 0;
        const wavePeriod = current.wave_period || 0;

        return {
          spot: spot.name,
          waveHeight,
          wavePeriod,
          waveDirection: current.wave_direction || 0,
          windSpeed,
          windDirection,
          rating: calculateSurfRating(waveHeight, wavePeriod, windSpeed),
        };
      })
    );

    return Response.json(results);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch surf data" },
      { status: 500 }
    );
  }
}
