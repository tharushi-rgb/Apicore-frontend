import foragePlantNamesCsv from '../data/forage_plants_names.csv?raw';

export interface ForageNames {
  english: string;
  sinhala: string;
  tamil: string;
}

function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1];
        if (next === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function buildForageNamesLookup(csvRaw: string): Record<string, ForageNames> {
  const lines = csvRaw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return {};

  const header = parseCsvRow(lines[0]);
  const idxScientific = header.indexOf('scientific_name');
  const idxEnglish = header.indexOf('english_name');
  const idxSinhala = header.indexOf('sinhala_name');
  const idxTamil = header.indexOf('tamil_name');

  if (idxScientific < 0) return {};

  const lookup: Record<string, ForageNames> = {};
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    const scientific = (row[idxScientific] ?? '').trim();
    if (!scientific) continue;

    lookup[scientific] = {
      english: (idxEnglish >= 0 ? row[idxEnglish] : '')?.trim() ?? '',
      sinhala: (idxSinhala >= 0 ? row[idxSinhala] : '')?.trim() ?? '',
      tamil: (idxTamil >= 0 ? row[idxTamil] : '')?.trim() ?? '',
    };
  }

  return lookup;
}

const FORAGE_NAMES_LOOKUP = buildForageNamesLookup(foragePlantNamesCsv);

export function getForageNames(scientificName: string | null | undefined): ForageNames | null {
  if (!scientificName) return null;
  const key = scientificName.trim();
  if (!key) return null;

  const direct = FORAGE_NAMES_LOOKUP[key];
  if (direct) return direct;

  // Fallback: match by binomial prefix ("Genus species")
  const tokens = key.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const binomial = `${tokens[0]} ${tokens[1]}`;
    for (const [scientific, names] of Object.entries(FORAGE_NAMES_LOOKUP)) {
      if (scientific === binomial || scientific.startsWith(`${binomial} `)) return names;
    }
  }

  return null;
}

export function formatForagePrimaryLabel(scientificName: string | null | undefined, fallbackLabel?: string): string {
  const names = getForageNames(scientificName);
  const english = (names?.english ?? '').trim();
  const sinhala = (names?.sinhala ?? '').trim();

  if (english && sinhala) return `${english} (${sinhala})`;
  if (english) return english;
  if (sinhala) return sinhala;

  const fallback = (fallbackLabel ?? '').trim();
  if (fallback) return fallback;

  return (scientificName ?? '').trim();
}
