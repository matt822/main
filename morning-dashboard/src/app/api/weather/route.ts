import { NextRequest } from "next/server";

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 49) return "Fog";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Rain";
  if (code <= 94) return "Snow";
  return "Thunderstorm";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get("lat") || "34.0195";
  const lng = searchParams.get("lng") || "-118.4912";

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=6`;

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Open-Meteo API error: ${res.status}`);

    const json = await res.json();
    const current = json.current;
    const daily = json.daily;

    return Response.json({
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      weatherCode: current.weather_code,
      description: getWeatherDescription(current.weather_code),
      daily: daily.time.slice(1).map((date: string, i: number) => ({
        date,
        tempMax: daily.temperature_2m_max[i + 1],
        tempMin: daily.temperature_2m_min[i + 1],
        weatherCode: daily.weather_code[i + 1],
        description: getWeatherDescription(daily.weather_code[i + 1]),
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
