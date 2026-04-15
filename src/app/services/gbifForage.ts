import forageCsvData from '../data/forage_records_from_csv.json';

// Build plant names lookup from hardcoded data
// This maps scientific names to English and Sinhala names
function buildPlantNamesLookup(): Record<string, { english: string; sinhala: string }> {
  // Direct mapping based on forage_plants_names.csv data
  return {
    "Oryza sativa L.": { english: "Rice", sinhala: "ගොයම්" },
    "Dioscorea alata L.": { english: "Purple Yam", sinhala: "ඇතුල්" },
    "Mimosa pudica L.": { english: "Sensitive Plant", sinhala: "නිදිකුම්බා" },
    "Calotropis gigantea (L.) W.T.Aiton": { english: "Crown Flower", sinhala: "මුතු ගෙඩි" },
    "Cocos nucifera L.": { english: "Coconut", sinhala: "පොල්" },
    "Lantana camara L.": { english: "Spanish Flag", sinhala: "ගන්දපාන" },
    "Nepenthes distillatoria L.": { english: "Pitcher Plant", sinhala: "බඳුන් වැල්" },
    "Barringtonia asiatica (L.) Kurz": { english: "Fish Poison Tree", sinhala: "දිය මීදෙල්" },
    "Artocarpus heterophyllus Lam.": { english: "Jackfruit", sinhala: "කොස්" },
    "Pontederia crassipes Mart.": { english: "Water Hyacinth", sinhala: "ජල නිල් මානෙල්" },
    "Arundina graminifolia (D.Don) Hochr.": { english: "Bamboo Orchid", sinhala: "බැම්බු ඕකිඩ්" },
    "Gloriosa superba L.": { english: "Flame Lily", sinhala: "නියාඟලා" },
    "Ipomoea pes-caprae (L.) R.Br.": { english: "Beach Morning Glory", sinhala: "මුහුදු මදන" },
    "Melastoma malabathricum L.": { english: "Indian Rhododendron", sinhala: "බෝවිටියා" },
    "Tridax procumbens L.": { english: "Coat Buttons", sinhala: "හීන්මැදුරු" },
    "Sphagneticola trilobata (L.) Pruski": { english: "Singapore Daisy", sinhala: "සිංගප්පූරු ඩේසි" },
    "Clitoria ternatea L.": { english: "Butterfly Pea", sinhala: "නිල් කතරොළු" },
    "Miconia crenata (Vahl) Michelang.": { english: "Miconia", sinhala: "මිකෝනියා" },
    "Nelumbo nucifera Gaertn.": { english: "Sacred Lotus", sinhala: "නෙළුම්" },
    "Dioscorea esculenta (Lour.) Burkill": { english: "Lesser Yam", sinhala: "කුකුලාලා" },
    "Oryza rufipogon Griff.": { english: "Wild Rice", sinhala: "වල් ගොයම්" },
    "Cyanthillium cinereum (L.) H.Rob.": { english: "Little Ironweed", sinhala: "මොණරකුඩුම්බිය" },
    "Asystasia intrusa (Forssk.) Blume": { english: "Asystasia", sinhala: "අසිස්ටේසියා" },
    "Rhododendron arboreum subsp. zeylanicum (Booth) Tagg": { english: "Tree Rhododendron", sinhala: "රෝඩොඩෙන්ඩ්‍රන්" },
    "Aristea ecklonii Baker": { english: "Blue Stars", sinhala: "නිල් තාරා මල්" },
    "Solanum torvum Sw.": { english: "Turkey Berry", sinhala: "තිබ්බටු" },
    "Tabernaemontana divaricata (L.) R.Br. ex Roem. & Schult.": { english: "Crape Jasmine", sinhala: "එරබදු සුදු" },
    "Chromolaena odorata (L.) R.M.King & H.Rob.": { english: "Siam Weed", sinhala: "පොඩි පත්මකුස්ස" },
    "Hellenia speciosa (J.Koenig) S.R.Dutta": { english: "Spiral Ginger", sinhala: "කට්ටියමුරුංගා" },
    "Persicaria capitata (Buch.-Ham. ex D.Don) H.Gross": { english: "Pink Knotweed", sinhala: "රෝස නට්වීඩ්" },
    "Terminalia catappa L.": { english: "Tropical Almond", sinhala: "කොට්ටම්බා" },
    "Solanum melongena L.": { english: "Brinjal", sinhala: "වම්බටු" },
    "Cassia fistula L.": { english: "Golden Shower Tree", sinhala: "ඇහැල" },
    "Couroupita guianensis Aubl.": { english: "Cannonball Tree", sinhala: "සාල මල් ගස" },
    "Mangifera indica L.": { english: "Mango", sinhala: "අඹ" },
    "Cerbera odollam Gaertn.": { english: "Sea Mango", sinhala: "ගොන කඩොල්" },
    "Scaevola taccada (Gaertn.) Roxb.": { english: "Beach Naupaka", sinhala: "මුහුදු නාවක්කාඩු" },
    "Rhododendron arboreum Sm.": { english: "Tree Rhododendron", sinhala: "රෝඩොඩෙන්ඩ්‍රන්" }
  };
}

const PLANT_NAMES_LOOKUP = buildPlantNamesLookup();

// Multilingual name mapping (curated from plant-common-names.js)
const PLANT_MULTILINGUAL_NAMES: Record<string, {
  english: string;
  sinhala: string;
  tamil: string;
}> = {
  "Oryza sativa": { english: "Rice", sinhala: "බතුරු", tamil: "அரிசி" },
  "Dioscorea alata": { english: "Purple Yam", sinhala: "ඇතුල්", tamil: "கருவிப்பு" },
  "Mimosa pudica": { english: "Sensitive Plant", sinhala: "නිඩඩු", tamil: "செண்பக மொட்டு" },
  "Calotropis gigantea": { english: "Crown Flower", sinhala: "මුතු ගෙඩි", tamil: "ஈட்டமண" },
  "Cocos nucifera": { english: "Coconut", sinhala: "පොල", tamil: "தேங்காய்" },
  "Lantana camara": { english: "Spanish Flag", sinhala: "ගෙරු ගෙඩි", tamil: "கொடி மணிப்பூ" },
  "Nepenthes distillatoria": { english: "Pitcher Plant", sinhala: "පිපිබෙර", tamil: "பிளவை பூண்டு" },
  "Barringtonia asiatica": { english: "Fish Poison Tree", sinhala: "බුරිතුඔ", tamil: "குட்டிமொட்டை" },
  "Oryza rufipogon": { english: "Wild Rice", sinhala: "වෙනත් බතුරු", tamil: "காட்டரிசி" },
  "Artocarpus heterophyllus": { english: "Jackfruit", sinhala: "අලුඹුටු", tamil: "பலா" },
  "Pontederia crassipes": { english: "Water Hyacinth", sinhala: "ජල කඩුල්", tamil: "சிவன் சோணை" },
  "Rhododendron arboreum": { english: "Tree Rhododendron", sinhala: "ගල් පූල්", tamil: "ரோடோ" },
  "Arundina graminifolia": { english: "Bamboo Orchid", sinhala: "බැස්ස ඕකිඩ්", tamil: "உருளை மொட்டு" },
  "Gloriosa superba": { english: "Flame Lily", sinhala: "ගිරිගිස්සි", tamil: "ஏற்றம் மலர்" },
  "Ipomoea pes-caprae": { english: "Beach Morning Glory", sinhala: "කඩුල්", tamil: "கடல் முழி" },
  "Melastoma malabathricum": { english: "Indian Rhododendron", sinhala: "කඩුල් පූල්", tamil: "நீலக்கொடி" },
  "Clitoria ternatea": { english: "Butterfly Pea", sinhala: "සිතුරු පූල්", tamil: "சிநந்தி" },
  "Tridax procumbens": { english: "Coat Buttons", sinhala: "ඩුවලුස්", tamil: "பொன்னாணி" },
  "Sphagneticola trilobata": { english: "Wedelia", sinhala: "ගෝඩිලි", tamil: "சூரியமுகி" },
  "Oryza eichingeri": { english: "Eichinger's Rice", sinhala: "බතුරු", tamil: "அரிசி" },
  "Miconia crenata": { english: "Miconia", sinhala: "මිකෝනියා", tamil: "மைக்கோனியா" },
  "Nelumbo nucifera": { english: "Sacred Lotus", sinhala: "පදුම", tamil: "அம்பிியல்" },
  "Dioscorea esculenta": { english: "Lesser Yam", sinhala: "ඇතුල්", tamil: "சூரணக் கிழங்கு" },
  "Solanum virginianum": { english: "Yellow Nightshade", sinhala: "තිතින් පටුටු", tamil: "தொடுவாண்டை" },
  "Cyanthillium cinereum": { english: "Bluish Thistle", sinhala: "මාසි ගෙඩි", tamil: "கோதுரை" },
  "Asystasia intrusa": { english: "Asystasia", sinhala: "අසිස්ටිසියා", tamil: "கண்ணிற்பூண்டு" },
  "Aristea ecklonii": { english: "Blue Eyebright", sinhala: "නිල් දෑස", tamil: "நீல கண்" },
  "Solanum torvum": { english: "Turkey Berry", sinhala: "බටු ගෙඩි", tamil: "சூரணக் குடையன்" },
  "Tabernaemontana divaricata": { english: "Crape Jasmine", sinhala: "ගිරිගිස්සි", tamil: "நங்குษா" },
  "Chromolaena odorata": { english: "Siam Weed", sinhala: "සයම් තෙලි", tamil: "சீயம் புல்" },
  "Hellenia speciosa": { english: "Hellenia", sinhala: "හෙලනියා", tamil: "හෙලනියා" },
  "Persicaria capitata": { english: "Bistorta", sinhala: "බිස්ටට", tamil: "பாலை" },
  "Terminalia catappa": { english: "Tropical Almond", sinhala: "බඩු ගෙඩි", tamil: "நாடൻ വാതപ്പായ" },
  "Solanum melongena": { english: "Brinjal", sinhala: "බටු ගෙඩි", tamil: "கத்தரிக்காய்" },
  "Cassia fistula": { english: "Golden Shower Tree", sinhala: "අලුවහල", tamil: "கொன்னை" },
  "Scaevola taccada": { english: "Beach Naupaka", sinhala: "සමුද්‍ර පූල්", tamil: "கடல் பூண்டு" },
  "Couroupita guianensis": { english: "Cannonball Tree", sinhala: "බෝම්බ ගසින්", tamil: "பீரங்கி மரம்" },
  "Mangifera indica": { english: "Mango", sinhala: "ආඹ", tamil: "மாம்பழம்" },
  "Cerbera odollam": { english: "Suicide Tree", sinhala: "අවිස්", tamil: "ஆரளி" }
};

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
    // Try to find names from the CSV-based lookup first
    const names = PLANT_NAMES_LOOKUP[record.scientificName] || { english: '', sinhala: '' };
    
    const normalized: GBIFForageSpecies = {
      scientificName: record.scientificName,
      common: names.english || record.scientificName,
      english: names.english || '',
      sinhala: names.sinhala || record.sinhalaName || '',
      tamil: '',
      sinhalaName: names.sinhala || record.sinhalaName || undefined,
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
