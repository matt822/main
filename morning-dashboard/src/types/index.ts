export interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  description: string
  daily: {
    date: string
    tempMax: number
    tempMin: number
    weatherCode: number
    description: string
  }[]
}

export interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  marketState: "PRE" | "REGULAR" | "POST" | "CLOSED"
}

export interface StockCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface GdeltArticle {
  title: string
  url: string
  source: string
  publishedAt: string
}

export interface SurfSpot {
  name: string
  lat: number
  lng: number
}

export interface SurfData {
  spot: string
  waveHeight: number
  wavePeriod: number
  waveDirection: number
  windSpeed: number
  windDirection: number
  rating: "Flat" | "Poor" | "Fair" | "Good" | "Epic"
}

export interface CommuteData {
  duration: number
  distance: number
  summary: string
}

export interface NewsSummary {
  summary: string
  topics: string[]
  generatedAt: string
}

export interface SpotifyTrack {
  name: string
  artist: string
  album: string
  albumArt: string
  isPlaying: boolean
  progressMs: number
  durationMs: number
}

export interface DashboardSettings {
  location: { lat: number; lng: number; name: string }
  workLocation: { lat: number; lng: number; name: string }
  stocks: string[]
  surfSpots: SurfSpot[]
  newsTopics: string[]
  userName: string
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  location: { lat: 34.0195, lng: -118.4912, name: "Santa Monica, CA" },
  workLocation: { lat: 37.3882, lng: -122.0145, name: "340 N Pastoria Ave, Sunnyvale, CA 94085" },
  stocks: ["SPY", "QQQ", "AAPL", "TSLA", "NVDA"],
  surfSpots: [
    { name: "Malibu", lat: 34.0369, lng: -118.6779 },
    { name: "Venice Beach", lat: 33.985, lng: -118.473 },
    { name: "Huntington Beach", lat: 33.6553, lng: -117.999 },
  ],
  newsTopics: ["geopolitics", "technology", "financial markets"],
  userName: "Matt",
}
