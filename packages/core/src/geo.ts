/**
 * Utah city coordinates & regions. Coordinates are city-center
 * approximations — good enough for distance sort/filter at Utah scale.
 * Lives in core so search, digest, and seed share one table.
 */

export type CityGeo = { lat: number; lng: number; region: string };

export const CITY_GEO: Record<string, CityGeo> = {
  "salt lake city": { lat: 40.7608, lng: -111.891, region: "salt_lake_valley" },
  slc: { lat: 40.7608, lng: -111.891, region: "salt_lake_valley" },
  "west valley city": { lat: 40.6916, lng: -112.0068, region: "salt_lake_valley" },
  "west jordan": { lat: 40.6097, lng: -111.9391, region: "salt_lake_valley" },
  "south jordan": { lat: 40.5622, lng: -111.9294, region: "salt_lake_valley" },
  sandy: { lat: 40.5649, lng: -111.8594, region: "salt_lake_valley" },
  murray: { lat: 40.6669, lng: -111.8861, region: "salt_lake_valley" },
  draper: { lat: 40.5247, lng: -111.8658, region: "salt_lake_valley" },
  midvale: { lat: 40.6136, lng: -111.8927, region: "salt_lake_valley" },
  taylorsville: { lat: 40.6686, lng: -111.9305, region: "salt_lake_valley" },
  "cottonwood heights": { lat: 40.6138, lng: -111.7872, region: "salt_lake_valley" },
  holladay: { lat: 40.6688, lng: -111.8247, region: "salt_lake_valley" },
  "university of utah": { lat: 40.7608, lng: -111.8412, region: "salt_lake_valley" },
  orem: { lat: 40.2969, lng: -111.6946, region: "utah_valley" },
  provo: { lat: 40.2338, lng: -111.6585, region: "utah_valley" },
  lehi: { lat: 40.3977, lng: -111.8561, region: "utah_valley" },
  "american fork": { lat: 40.3769, lng: -111.7958, region: "utah_valley" },
  "spanish fork": { lat: 40.1877, lng: -111.6533, region: "utah_valley" },
  "pleasant grove": { lat: 40.3644, lng: -111.7386, region: "utah_valley" },
  springville: { lat: 40.1652, lng: -111.6102, region: "utah_valley" },
  payson: { lat: 40.0444, lng: -111.7391, region: "utah_valley" },
  "utah valley university": { lat: 40.2769, lng: -111.7133, region: "utah_valley" },
  "brigham young university": { lat: 40.2518, lng: -111.6493, region: "utah_valley" },
  layton: { lat: 41.0602, lng: -111.9588, region: "davis_weber" },
  ogden: { lat: 41.223, lng: -111.9738, region: "davis_weber" },
  clearfield: { lat: 41.1308, lng: -111.9344, region: "davis_weber" },
  bountiful: { lat: 40.8894, lng: -111.8808, region: "davis_weber" },
  roy: { lat: 41.1616, lng: -112.0252, region: "davis_weber" },
  "west haven": { lat: 41.2627, lng: -112.0024, region: "davis_weber" },
  syracuse: { lat: 41.0894, lng: -112.0646, region: "davis_weber" },
  "weber state university": { lat: 41.1886, lng: -111.9366, region: "davis_weber" },
  logan: { lat: 41.7355, lng: -111.8344, region: "cache_valley" },
  "utah state university": { lat: 41.737, lng: -111.8147, region: "cache_valley" },
  "st. george": { lat: 37.0965, lng: -113.5684, region: "southern_utah" },
  "st george": { lat: 37.0965, lng: -113.5684, region: "southern_utah" },
  "cedar city": { lat: 37.6775, lng: -113.0619, region: "southern_utah" },
};

export function geoForCity(city: string | null | undefined): CityGeo | null {
  if (!city) return null;
  return CITY_GEO[city.trim().toLowerCase()] ?? null;
}
