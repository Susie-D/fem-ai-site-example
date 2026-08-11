export type City = {
  name: string;
  country: string;
  season: string;
  lat: number;
  lng: number;
  copy: string;
  accent: string;
  glow: string;
};

export const cities: City[] = [
  {
    name: "Tokyo",
    country: "Japan",
    season: "Spring",
    lat: 35.6762,
    lng: 139.6503,
    copy: "The city exhales in pink light, where tradition rises and tomorrow quietly takes shape.",
    accent: "#ffb7c9",
    glow: "#ef7f9e",
  },
  {
    name: "Cairo",
    country: "Egypt",
    season: "Summer",
    lat: 30.0444,
    lng: 31.2357,
    copy: "Light becomes architecture, casting the river, stone and sky in molten gold.",
    accent: "#f5c778",
    glow: "#d99a45",
  },
  {
    name: "Paris",
    country: "France",
    season: "Autumn",
    lat: 48.8566,
    lng: 2.3522,
    copy: "The afternoon folds into bronze, glass and the slow choreography of fallen leaves.",
    accent: "#d7ad72",
    glow: "#be774e",
  },
  {
    name: "New York",
    country: "United States",
    season: "Late Autumn",
    lat: 40.7128,
    lng: -74.006,
    copy: "Steel catches the final coral light as the first snow edits the city into silence.",
    accent: "#ef9b85",
    glow: "#da6d67",
  },
  {
    name: "Ushuaia",
    country: "Argentina",
    season: "Deep Winter",
    lat: -54.8019,
    lng: -68.303,
    copy: "At the end of the continent, ice, wind and southern light move as one.",
    accent: "#8ee7df",
    glow: "#65abd4",
  },
];

export const solarPositions = [0.015, 0.25, 0.5, 0.75, 0.985];

export function bezierPoint(t: number) {
  const start = { x: 52, y: 106 };
  const control = { x: 500, y: -76 };
  const end = { x: 948, y: 106 };
  const inv = 1 - t;
  return {
    x: inv * inv * start.x + 2 * inv * t * control.x + t * t * end.x,
    y: inv * inv * start.y + 2 * inv * t * control.y + t * t * end.y,
  };
}
