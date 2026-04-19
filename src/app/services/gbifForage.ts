import forageCsvData from '../data/forage_records_from_csv.json';
import { getForageNames } from './forageNames';

interface CsvHotspot {
  lat: number;
  lng: number;
  count: number;
}

interface CsvForageRecord {
  scientificName: string;
  recordCount: number;
  observedMonths: number[];
  observedMonthCounts: Record<string, number>;
  sinhalaName: string;
  hotspots: CsvHotspot[];
}

export interface GBIFForageSpecies {
  scientificName: string;
  common: string; // english name or scientific name as fallback
  english: string;
  sinhala: string;
  tamil: string;
  sinhalaName?: string; // deprecated - use 'sinhala'
  gbifCount: number;
  observedMonths: number[];
  observedMonthCounts: Record<string, number>;
  hotspots: [number, number, number][];
  popularityRank?: number;
}

const CSV_RECORDS = (forageCsvData.records as CsvForageRecord[])
  .filter((record) => !!record.scientificName && Number.isFinite(record.recordCount) && record.scientificName !== 'Plantae')
  .sort((a, b) => b.recordCount - a.recordCount);

export const GBIF_FORAGE_SPECIES: Record<string, GBIFForageSpecies> = Object.fromEntries(
  CSV_RECORDS.map((record, idx) => {
    const names = getForageNames(record.scientificName);
    const english = (names?.english ?? '').trim();
    const sinhala = ((names?.sinhala ?? '').trim() || (record.sinhalaName ?? '').trim());
    const tamil = (names?.tamil ?? '').trim();

    const normalized: GBIFForageSpecies = {
      scientificName: record.scientificName,
      common: english || record.scientificName,
      english,
      sinhala,
      tamil,
      sinhalaName: sinhala || undefined,
      gbifCount: record.recordCount,
      observedMonths: Array.isArray(record.observedMonths) ? record.observedMonths : [],
      observedMonthCounts: record.observedMonthCounts || {},
      hotspots: (record.hotspots || []).map((hotspot) => [hotspot.lat, hotspot.lng, hotspot.count]),
      popularityRank: idx + 1,
    };
    return [record.scientificName, normalized];
  })
);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearbyGBIFForage(
  lat: number,
  lng: number,
  opts?: { currentMonthOnly?: boolean; radiusKm?: number; minNearbyCount?: number }
): Array<GBIFForageSpecies & { scientific: string; nearbyCount: number }> {
  const month = new Date().getMonth() + 1;
  const radiusKm = opts?.radiusKm ?? 18;
  const minNearbyCount = opts?.minNearbyCount ?? 1;

  const results: Array<GBIFForageSpecies & { scientific: string; nearbyCount: number }> = [];

  for (const [scientific, species] of Object.entries(GBIF_FORAGE_SPECIES)) {
    if (opts?.currentMonthOnly && !species.observedMonths.includes(month)) continue;

    let nearbyCount = 0;
    for (const [hotspotLat, hotspotLng, hotspotCount] of species.hotspots) {
      const distance = haversineKm(lat, lng, hotspotLat, hotspotLng);
      if (distance <= radiusKm) {
        nearbyCount += hotspotCount;
      }
    }

    if (nearbyCount >= minNearbyCount) {
      results.push({ ...species, scientific, nearbyCount });
    }
  }

  results.sort((left, right) => {
    if (right.nearbyCount !== left.nearbyCount) return right.nearbyCount - left.nearbyCount;
    return right.gbifCount - left.gbifCount;
  });

  return results.slice(0, 120);
}

export function getGBIFBiodiversityScore(lat: number, lng: number): number {
  const nearby = getNearbyGBIFForage(lat, lng);
  if (nearby.length === 0) return 0;
  const richnessScore = Math.min(60, nearby.length * 4);
  const densityScore = Math.min(20, Math.round(nearby.slice(0, 10).reduce((sum, species) => sum + species.nearbyCount, 0) / 100));
  return Math.min(80, richnessScore + densityScore);
}
