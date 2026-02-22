type CityLocation = {
  city: string;
  lat: number;
  lng: number;
};

const INDIAN_CITY_COORDS: CityLocation[] = [
  { city: "Delhi", lat: 28.6139, lng: 77.209 },
  { city: "Mumbai", lat: 19.076, lng: 72.8777 },
  { city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { city: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { city: "Chennai", lat: 13.0827, lng: 80.2707 },
  { city: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { city: "Pune", lat: 18.5204, lng: 73.8567 },
  { city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { city: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { city: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { city: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { city: "Ludhiana", lat: 30.901, lng: 75.8573 },
  { city: "Jalandhar", lat: 31.326, lng: 75.5762 },
  { city: "Amritsar", lat: 31.634, lng: 74.8723 },
  { city: "Surat", lat: 21.1702, lng: 72.8311 },
  { city: "Indore", lat: 22.7196, lng: 75.8577 },
  { city: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { city: "Kanpur", lat: 26.4499, lng: 80.3319 },
  { city: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { city: "Patna", lat: 25.5941, lng: 85.1376 },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const withAliases = (value: string) => {
  const lower = normalize(value);
  if (lower === "bangalore") return "bengaluru";
  if (lower === "calcutta") return "kolkata";
  if (lower === "bombay") return "mumbai";
  return lower;
};

export const cityFromText = (value?: string | null) => {
  if (!value) return null;
  const firstPart = value.split(",")[0] ?? value;
  const normalized = withAliases(firstPart);
  if (!normalized) return null;

  const direct = INDIAN_CITY_COORDS.find(
    (item) => withAliases(item.city) === normalized
  );
  if (direct) return direct;

  return (
    INDIAN_CITY_COORDS.find((item) => normalize(value).includes(withAliases(item.city))) ??
    null
  );
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const distanceKm = (a: CityLocation, b: CityLocation) => {
  const radius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return radius * c;
};

export const cityCoordinates = INDIAN_CITY_COORDS;
