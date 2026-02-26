// gbifForage.ts — GBIF-sourced bee forage plant data for Sri Lanka
// Source: GBIF Occurrence Download — dataset 0017890-260108223611665
// Contains 35,153 georeferenced records of plant occurrences in Sri Lanka.
// Pre-processed to extract 34 bee-relevant species with GPS hotspot clusters.
// Each species entry includes a hotspots array: [lat, lng, count] at 0.5° grid resolution (~55km cells).

export interface GBIFForageSpecies {
  /** Common name in Sri Lanka context */
  common: string;
  /** Forage quality for honeybees */
  grade: 'excellent' | 'high' | 'medium' | 'low';
  /** Resources provided */
  resources: ('nectar' | 'pollen')[];
  /** Bloom season start month (1=Jan) */
  bloomStart: number;
  /** Bloom season end month (12=Dec) */
  bloomEnd: number;
  /** Climate zone where abundant */
  zone: 'all' | 'wet' | 'dry' | 'mid';
  /** Beekeeping note */
  note: string;
  /** Total GBIF occurrence records found in Sri Lanka */
  gbifCount: number;
  /**
   * Hotspot clusters: [lat, lng, count] at 0.5° grid resolution.
   * Top 8 cells by record density. Use for proximity lookups.
   */
  hotspots: [number, number, number][];
}

// Pre-processed from GBIF dataset — 34 bee forage species confirmed present in Sri Lanka
export const GBIF_FORAGE_SPECIES: Record<string, GBIFForageSpecies> = {
  "Artocarpus altilis":      { common: "Breadfruit",             grade: "medium",    resources: ["pollen"],           bloomStart: 3,  bloomEnd: 6,  zone: "wet", note: "Pollen source in home gardens",              gbifCount: 62,   hotspots: [[6.0,80.0,12],[7.0,80.0,10],[6.5,80.0,7],[7.0,81.0,6],[6.0,80.5,5],[7.0,80.5,5],[6.5,80.5,4],[7.5,80.0,2]] },
  "Artocarpus heterophyllus":{ common: "Jackfruit / Jak",        grade: "medium",    resources: ["nectar"],           bloomStart: 2,  bloomEnd: 5,  zone: "wet", note: "Common in home gardens, seasonal nectar",    gbifCount: 177,  hotspots: [[7.5,80.5,47],[7.0,80.0,30],[7.0,81.0,16],[6.5,80.5,16],[6.5,80.0,12],[7.0,80.5,12],[6.0,80.5,11],[6.5,81.0,7]] },
  "Barringtonia asiatica":   { common: "Sea Putat",              grade: "medium",    resources: ["nectar"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Coastal, night-blooming with daytime nectar", gbifCount: 244,  hotspots: [[6.0,80.0,74],[6.0,80.5,47],[7.0,80.0,44],[6.5,80.0,44],[7.5,80.0,13],[6.0,81.0,6],[8.5,81.0,3],[7.0,82.0,2]] },
  "Calotropis gigantea":     { common: "Wara / Crown Flower",    grade: "excellent", resources: ["nectar","pollen"],  bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Year-round bloomer, excellent nectar yield",  gbifCount: 311,  hotspots: [[6.5,81.5,59],[6.5,81.0,32],[6.0,81.0,27],[6.0,80.5,26],[8.5,81.0,19],[7.0,80.0,17],[8.0,80.5,15],[7.5,80.5,15]] },
  "Caryota urens":           { common: "Kithul Palm",            grade: "high",      resources: ["nectar"],           bloomStart: 1,  bloomEnd: 12, zone: "wet", note: "Hill country; source of kithul honey",        gbifCount: 70,   hotspots: [[6.5,80.5,24],[7.5,80.5,19],[7.0,81.0,6],[7.0,80.5,6],[7.0,80.0,6],[8.0,81.0,3],[6.5,80.0,2],[8.5,80.5,2]] },
  "Cassia fistula":          { common: "Golden Shower Tree",     grade: "high",      resources: ["pollen"],           bloomStart: 3,  bloomEnd: 6,  zone: "all", note: "Excellent pollen source, seasonal bloom",     gbifCount: 85,   hotspots: [[7.0,80.0,19],[8.0,81.0,13],[7.5,80.5,8],[6.5,81.5,7],[8.5,80.5,7],[6.0,81.0,4],[8.0,80.5,4],[6.0,80.0,3]] },
  "Cassia roxburghii":       { common: "Red Cassia",             grade: "high",      resources: ["pollen"],           bloomStart: 8,  bloomEnd: 11, zone: "dry", note: "Dry zone flowering tree, late season",        gbifCount: 23,   hotspots: [[8.0,81.0,11],[6.5,81.5,4],[8.0,80.5,2],[8.5,81.0,2],[8.5,80.5,1],[8.5,81.5,1],[7.0,81.0,1],[9.5,80.5,1]] },
  "Chromolaena odorata":     { common: "Siam Weed",              grade: "low",       resources: ["pollen"],           bloomStart: 1,  bloomEnd: 3,  zone: "all", note: "Invasive weed, minor early-year pollen",      gbifCount: 92,   hotspots: [[6.5,81.5,12],[8.0,80.5,12],[6.5,81.0,9],[7.0,80.0,9],[6.0,81.0,6],[8.0,81.0,5],[6.0,80.0,5],[7.0,81.0,5]] },
  "Cinnamomum verum":        { common: "True Cinnamon",          grade: "low",       resources: ["pollen"],           bloomStart: 3,  bloomEnd: 5,  zone: "wet", note: "Spice crop, minor pollen source",             gbifCount: 60,   hotspots: [[7.0,80.0,14],[7.5,80.5,13],[7.0,80.5,13],[6.5,80.5,5],[6.5,80.0,5],[6.0,80.5,3],[7.0,81.0,3],[9.5,80.5,1]] },
  "Clitoria ternatea":       { common: "Blue Pea / Aparajita",   grade: "high",      resources: ["nectar"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Continuous bloom, heavily visited by bees",   gbifCount: 143,  hotspots: [[7.0,80.0,22],[7.5,80.5,19],[6.5,81.0,14],[6.0,81.0,10],[7.0,80.5,9],[7.0,81.0,9],[9.5,80.0,7],[8.0,80.5,6]] },
  "Cocos nucifera":          { common: "Coconut",                grade: "high",      resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Year-round pollen; coastal & low country",    gbifCount: 265,  hotspots: [[7.0,80.0,60],[7.0,81.0,44],[6.5,80.0,23],[6.0,80.0,20],[8.0,80.5,19],[7.5,80.5,16],[6.0,80.5,13],[7.5,80.0,13]] },
  "Coffea arabica":          { common: "Arabica Coffee",         grade: "high",      resources: ["nectar"],           bloomStart: 4,  bloomEnd: 6,  zone: "mid", note: "Short intense bloom after rain",              gbifCount: 26,   hotspots: [[7.0,80.0,6],[7.0,80.5,6],[7.5,80.5,4],[6.0,80.5,3],[6.5,80.0,2],[6.0,80.0,2],[7.5,80.0,1],[6.5,80.5,1]] },
  "Coffea liberica":         { common: "Liberica Coffee",        grade: "high",      resources: ["nectar"],           bloomStart: 4,  bloomEnd: 6,  zone: "wet", note: "Seasonal nectar, less common",                gbifCount: 4,    hotspots: [[7.5,80.5,4]] },
  "Ficus benghalensis":      { common: "Banyan Tree",            grade: "medium",    resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Widespread pollen source, sacred tree",       gbifCount: 76,   hotspots: [[8.0,81.0,11],[7.0,80.0,11],[6.0,80.0,9],[7.5,81.5,5],[7.5,80.5,5],[6.5,81.0,5],[6.5,81.5,4],[8.5,80.5,4]] },
  "Ficus racemosa":          { common: "Cluster Fig",            grade: "medium",    resources: ["nectar","pollen"],  bloomStart: 1,  bloomEnd: 12, zone: "wet", note: "Riverine habitat, year-round forage",         gbifCount: 25,   hotspots: [[7.0,80.0,9],[6.0,80.5,3],[8.0,81.0,3],[7.0,81.0,3],[7.5,80.5,2],[7.0,80.5,2],[7.5,81.0,2],[6.0,81.0,1]] },
  "Ficus religiosa":         { common: "Bo Tree / Peepul",       grade: "medium",    resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Sacred tree, year-round minor pollen",        gbifCount: 77,   hotspots: [[7.0,80.0,17],[8.5,80.5,15],[7.5,80.5,8],[8.0,80.5,6],[7.0,81.0,5],[8.0,81.0,5],[9.5,80.0,4],[6.5,80.0,4]] },
  "Gloriosa superba":        { common: "Flame Lily",             grade: "medium",    resources: ["pollen"],           bloomStart: 8,  bloomEnd: 11, zone: "all", note: "Sri Lanka national flower, seasonal pollen",  gbifCount: 155,  hotspots: [[6.0,80.5,21],[6.0,80.0,21],[7.5,80.5,17],[7.0,81.0,12],[6.5,80.5,9],[6.5,80.0,9],[6.5,81.5,8],[8.0,81.0,8]] },
  "Lantana camara":          { common: "Lantana",                grade: "medium",    resources: ["nectar"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Roadside weed, continuous small nectar flow", gbifCount: 250,  hotspots: [[7.0,81.0,36],[7.0,80.0,35],[7.5,80.5,24],[6.5,81.5,16],[6.0,80.0,16],[6.0,81.0,13],[7.0,80.5,13],[7.5,81.0,12]] },
  "Mangifera indica":        { common: "Mango",                  grade: "high",      resources: ["nectar","pollen"],  bloomStart: 1,  bloomEnd: 3,  zone: "dry", note: "Major spring honey crop, heavy seasonal bloom",gbifCount: 82,   hotspots: [[7.0,80.0,19],[7.5,80.5,13],[6.5,81.5,8],[9.5,80.0,7],[8.0,80.5,4],[6.0,80.5,3],[7.5,81.5,3],[6.5,80.0,3]] },
  "Mimosa pudica":           { common: "Touch-me-not / Nidikumba",grade: "low",     resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Common weed, minor pollen across all zones",  gbifCount: 342,  hotspots: [[7.0,80.0,63],[7.5,80.5,34],[7.0,81.0,31],[6.5,80.5,27],[8.0,81.0,26],[6.0,80.5,19],[7.5,80.0,17],[7.0,80.5,17]] },
  "Nelumbo nucifera":        { common: "Sacred Lotus",           grade: "high",      resources: ["nectar","pollen"],  bloomStart: 6,  bloomEnd: 9,  zone: "all", note: "Tanks and wetlands, excellent summer forage",  gbifCount: 122,  hotspots: [[8.0,81.0,29],[6.5,81.5,24],[8.0,80.5,15],[7.5,80.0,7],[7.0,80.0,6],[6.0,81.0,5],[6.5,81.0,5],[7.5,80.5,5]] },
  "Nymphaea nouchali":       { common: "Blue Water Lily",        grade: "medium",    resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "National flower, pollen in tanks & wetlands", gbifCount: 74,   hotspots: [[7.0,80.0,17],[8.0,80.5,11],[6.5,80.5,7],[7.5,80.5,6],[6.5,81.5,5],[7.0,81.0,4],[6.0,80.0,4],[8.5,80.5,4]] },
  "Nymphaea pubescens":      { common: "Hairy Water Lily",       grade: "medium",    resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Pollen in wetlands and irrigation tanks",     gbifCount: 23,   hotspots: [[6.5,81.5,4],[7.0,80.0,3],[8.0,80.5,3],[8.0,81.0,3],[7.5,80.5,2],[6.5,81.0,2],[6.0,80.0,2],[8.5,80.5,1]] },
  "Nymphaea rubra":          { common: "Red Water Lily",         grade: "medium",    resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Pollen source in tanks & wetlands",           gbifCount: 54,   hotspots: [[7.0,80.0,14],[6.0,80.5,5],[8.0,81.0,5],[6.5,81.5,5],[8.5,80.0,5],[8.0,80.5,4],[6.0,80.0,4],[7.5,80.5,3]] },
  "Oryza sativa":            { common: "Rice / Paddy",           grade: "low",       resources: ["pollen"],           bloomStart: 3,  bloomEnd: 9,  zone: "all", note: "Widespread pollen, Maha & Yala season crops", gbifCount: 3145, hotspots: [[7.5,80.5,404],[8.0,80.5,360],[6.0,80.0,263],[6.5,80.0,235],[6.0,80.5,224],[6.5,80.5,202],[7.0,80.5,175],[9.5,80.0,166]] },
  "Solanum melongena":       { common: "Brinjal / Eggplant",     grade: "medium",    resources: ["pollen"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Vegetable crop, buzz-pollinated pollen",      gbifCount: 86,   hotspots: [[7.5,80.5,11],[7.0,80.0,10],[8.0,80.0,10],[6.5,80.0,10],[8.0,80.5,8],[7.5,80.0,6],[6.0,81.0,6],[6.5,81.0,5]] },
  "Syzygium caryophyllatum": { common: "Ceylon Olive / Madan",   grade: "high",      resources: ["nectar"],           bloomStart: 4,  bloomEnd: 7,  zone: "wet", note: "Forest edges & gardens, good nectar flow",    gbifCount: 27,   hotspots: [[7.0,80.0,17],[6.5,80.0,4],[6.5,80.5,3],[7.5,80.5,1],[6.0,80.5,1],[7.0,80.5,1]] },
  "Syzygium cumini":         { common: "Jamun / Java Plum",      grade: "high",      resources: ["nectar"],           bloomStart: 3,  bloomEnd: 5,  zone: "all", note: "Excellent nectar — major honey plant in season",gbifCount: 14,  hotspots: [[7.0,80.0,3],[7.0,81.5,2],[8.5,80.0,2],[8.5,81.0,2],[9.5,80.0,1],[7.5,81.5,1],[9.0,81.0,1],[7.5,80.5,1]] },
  "Tamarindus indica":       { common: "Tamarind",               grade: "medium",    resources: ["nectar"],           bloomStart: 3,  bloomEnd: 6,  zone: "dry", note: "Dry zone, seasonal nectar from cluster blooms",gbifCount: 48,  hotspots: [[7.0,80.0,13],[8.0,81.0,9],[7.5,80.5,5],[8.5,80.5,4],[8.0,80.5,3],[6.5,81.5,3],[9.5,80.0,2],[6.0,80.5,2]] },
  "Terminalia arjuna":       { common: "Arjun Tree",             grade: "medium",    resources: ["nectar"],           bloomStart: 4,  bloomEnd: 7,  zone: "all", note: "Riverbanks & tanks, seasonal nectar",         gbifCount: 54,   hotspots: [[7.0,80.0,11],[8.5,80.0,8],[8.0,80.5,6],[8.0,81.0,6],[6.5,81.5,5],[7.5,80.5,3],[8.0,80.0,3],[8.5,80.5,2]] },
  "Terminalia catappa":      { common: "Sea Almond / Kottamba",  grade: "medium",    resources: ["nectar"],           bloomStart: 3,  bloomEnd: 7,  zone: "all", note: "Coastal & roadsides, seasonal nectar",        gbifCount: 87,   hotspots: [[7.0,80.0,20],[6.0,80.5,15],[6.0,80.0,8],[6.5,80.0,8],[7.0,80.5,7],[7.5,80.0,5],[6.0,81.0,4],[7.5,81.5,4]] },
  "Tridax procumbens":       { common: "Coatbuttons / Thumbe",   grade: "medium",    resources: ["nectar"],           bloomStart: 1,  bloomEnd: 12, zone: "all", note: "Common roadside weed, continuous small nectar",gbifCount: 143,  hotspots: [[7.0,80.0,48],[7.5,80.5,23],[6.0,80.5,8],[6.0,80.0,8],[8.0,80.5,7],[7.5,80.0,7],[6.5,81.0,6],[8.5,80.5,6]] },
};

// ─── Helper: Get bee forage species observed near a GPS point ─────────────────

/**
 * Returns GBIF-verified bee forage species observed within ~80km of the given
 * coordinates. Uses pre-computed 0.5° hotspot grid (≈55km cells). Checks the
 * exact cell plus all 8 neighbours. Returns entries sorted by grade + count.
 */
export function getNearbyGBIFForage(
  lat: number,
  lng: number,
  opts?: { minGrade?: 'low' | 'medium' | 'high' | 'excellent'; currentMonthOnly?: boolean }
): Array<GBIFForageSpecies & { scientific: string; nearbyCount: number }> {
  const GRADE_ORDER = { excellent: 4, high: 3, medium: 2, low: 1 };
  const MIN_GRADE = opts?.minGrade ? GRADE_ORDER[opts.minGrade] : 1;
  const month = new Date().getMonth() + 1;

  // Snap to 0.5° grid
  const cellLat = Math.round(lat * 2) / 2;
  const cellLng = Math.round(lng * 2) / 2;

  // Check this cell + 8 neighbours (covers ~80-110km radius)
  const cells = new Set<string>();
  for (let dlat = -0.5; dlat <= 0.5; dlat += 0.5) {
    for (let dlng = -0.5; dlng <= 0.5; dlng += 0.5) {
      const cl = Math.round((cellLat + dlat) * 10) / 10;
      const clg = Math.round((cellLng + dlng) * 10) / 10;
      cells.add(`${cl},${clg}`);
    }
  }

  const results: Array<GBIFForageSpecies & { scientific: string; nearbyCount: number }> = [];

  for (const [scientific, species] of Object.entries(GBIF_FORAGE_SPECIES)) {
    if (GRADE_ORDER[species.grade] < MIN_GRADE) continue;
    if (opts?.currentMonthOnly && (month < species.bloomStart || month > species.bloomEnd)) continue;

    // Sum up counts from nearby hotspot cells
    let nearbyCount = 0;
    for (const [hsLat, hsLng, hsCount] of species.hotspots) {
      const key = `${hsLat},${hsLng}`;
      if (cells.has(key)) nearbyCount += hsCount;
    }

    if (nearbyCount > 0) {
      results.push({ ...species, scientific, nearbyCount });
    }
  }

  // Sort: grade desc → nearbyCount desc
  results.sort((a, b) => {
    const gDiff = GRADE_ORDER[b.grade] - GRADE_ORDER[a.grade];
    return gDiff !== 0 ? gDiff : b.nearbyCount - a.nearbyCount;
  });

  return results;
}

/**
 * Returns a biodiversity score (0–100) for a location based on GBIF forage
 * richness. Used as a bonus factor in the hive suitability calculation.
 * - 0 species  → 0
 * - 5 species  → ~30
 * - 10+ species → 50–60
 * - 15+ excellent/high → up to 80
 */
export function getGBIFBiodiversityScore(lat: number, lng: number): number {
  const nearby = getNearbyGBIFForage(lat, lng);
  if (nearby.length === 0) return 0;

  const GRADE_WEIGHT = { excellent: 10, high: 7, medium: 4, low: 1 };
  const rawScore = nearby.reduce((sum, s) => sum + GRADE_WEIGHT[s.grade], 0);
  // Cap at 80 points (max possible contribution to suitability)
  return Math.min(80, rawScore);
}
