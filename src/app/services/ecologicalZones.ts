import ecologicalZonesData from '../data/ecological_zones.json';

export interface EcologicalZone {
  zone: string;
  keyRegions: string[];
  primaryForagePlants: string;
  honeyFlowPeriod: string;
}

/**
 * Service for managing and retrieving ecological zone data
 */
export const ecologicalZonesService = {
  /**
   * Get all ecological zones
   */
  getAllZones(): EcologicalZone[] {
    return (ecologicalZonesData as EcologicalZone[]).sort((a, b) => a.zone.localeCompare(b.zone));
  },

  /**
   * Get the zone for a specific district
   * @param district - District name
   * @returns The ecological zone for the district, or null if not found
   */
  getZoneByDistrict(district: string): EcologicalZone | null {
    if (!district) return null;

    const zones = this.getAllZones();
    for (const zone of zones) {
      if (zone.keyRegions.some((region) => region.toLowerCase() === district.toLowerCase())) {
        return zone;
      }
    }
    return null;
  },

  /**
   * Get all zones by multiple districts
   * @param districts - Array of district names
   * @returns Array of zones for the districts (deduped)
   */
  getZonesByDistricts(districts: string[]): EcologicalZone[] {
    const zones: Map<string, EcologicalZone> = new Map();
    for (const district of districts) {
      const zone = this.getZoneByDistrict(district);
      if (zone && !zones.has(zone.zone)) {
        zones.set(zone.zone, zone);
      }
    }
    return Array.from(zones.values());
  },

  /**
   * Get all districts in a specific zone
   * @param zoneName - Zone name
   * @returns Array of district names in the zone
   */
  getDistrictsByZone(zoneName: string): string[] {
    const zone = this.getAllZones().find((z) => z.zone.toLowerCase() === zoneName.toLowerCase());
    return zone ? zone.keyRegions : [];
  },

  /**
   * Check if a district belongs to any zone
   * @param district - District name
   * @returns true if district is in any zone
   */
  isDistrictInZone(district: string): boolean {
    return this.getZoneByDistrict(district) !== null;
  },

  /**
   * Get honey flow information for a district
   * @param district - District name
   * @returns Honey flow period or null if not found
   */
  getHoneyFlowByDistrict(district: string): string | null {
    const zone = this.getZoneByDistrict(district);
    return zone ? zone.honeyFlowPeriod : null;
  },

  /**
   * Get primary forage plants for a district
   * @param district - District name
   * @returns Primary forage plants or null if not found
   */
  getForagePlantsByDistrict(district: string): string | null {
    const zone = this.getZoneByDistrict(district);
    return zone ? zone.primaryForagePlants : null;
  },
};
