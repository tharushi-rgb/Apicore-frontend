import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = path.resolve(process.cwd());
const constantsPath = path.join(repoRoot, 'src', 'app', 'constants', 'sriLankaLocations.ts');
const reportPath = path.join(repoRoot, 'ds_resolution_report.json');

function extractDsDivisionsByDistrict(sourceText) {
  const match = sourceText.match(/export const DS_DIVISIONS_BY_DISTRICT:[\s\S]*?=\s*({[\s\S]*?});\n\nexport const DISTRICT_CENTERS/);
  if (!match) {
    throw new Error('Could not find DS_DIVISIONS_BY_DISTRICT in sriLankaLocations.ts');
  }

  return vm.runInNewContext(`(${match[1]})`, {});
}

function getDistrictCenter(district) {
  const centers = {
    Ampara: { lat: 7.2833, lng: 81.6667 },
    Anuradhapura: { lat: 8.3356, lng: 80.4067 },
    Badulla: { lat: 6.9898, lng: 81.0556 },
    Batticaloa: { lat: 7.717, lng: 81.7 },
    Colombo: { lat: 6.9271, lng: 79.8612 },
    Galle: { lat: 6.0535, lng: 80.221 },
    Gampaha: { lat: 7.0917, lng: 80.0 },
    Hambantota: { lat: 6.1241, lng: 81.1185 },
    Jaffna: { lat: 9.6615, lng: 80.0255 },
    Kalutara: { lat: 6.5854, lng: 79.9607 },
    Kandy: { lat: 7.2906, lng: 80.6337 },
    Kegalle: { lat: 7.2513, lng: 80.3464 },
    Kilinochchi: { lat: 9.3803, lng: 80.377 },
    Kurunegala: { lat: 7.4863, lng: 80.3624 },
    Mannar: { lat: 8.978, lng: 79.9044 },
    Matale: { lat: 7.4675, lng: 80.6234 },
    Matara: { lat: 5.9549, lng: 80.555 },
    Monaragala: { lat: 6.8727, lng: 81.3506 },
    Mullaitivu: { lat: 9.2671, lng: 80.812 },
    'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
    Polonnaruwa: { lat: 7.9403, lng: 81.0188 },
    Puttalam: { lat: 8.0362, lng: 79.8283 },
    Ratnapura: { lat: 6.6828, lng: 80.3992 },
    Trincomalee: { lat: 8.5874, lng: 81.2152 },
    Vavuniya: { lat: 8.7514, lng: 80.4997 },
  };
  return centers[district] || { lat: 7.8731, lng: 80.7718 };
}

function scoreCandidate(candidate, normalizedDistrict, normalizedDs) {
  const display = String(candidate?.display_name ?? '').toLowerCase();
  const address = candidate?.address && typeof candidate.address === 'object' ? candidate.address : {};
  const addressText = Object.values(address).map((value) => String(value).toLowerCase()).join(' ');
  const combined = `${display} ${addressText}`;

  let score = 0;
  if (combined.includes(normalizedDs)) score += 3;
  if (combined.includes(normalizedDistrict)) score += 2;
  if (combined.includes('divisional secretariat') || combined.includes('ds division')) score += 2;
  if (String(candidate?.type ?? '').toLowerCase().includes('administrative')) score += 1;
  if (String(candidate?.class ?? '').toLowerCase().includes('boundary')) score += 1;
  return score;
}

async function resolveDsDivisionCenter(district, dsDivision) {
  const queries = [
    `${dsDivision} Divisional Secretariat, ${district} District, Sri Lanka`,
    `${dsDivision} DS Division, ${district} District, Sri Lanka`,
    `${dsDivision}, ${district}, Sri Lanka`,
  ];

  const normalizedDistrict = district.trim().toLowerCase();
  const normalizedDs = dsDivision.trim().toLowerCase();

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '8',
      countrycodes: 'lk',
      addressdetails: '1',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        accept: 'application/json',
        'user-agent': 'ApicoreDSResolverTest/1.0 (local validation)',
      },
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const candidates = Array.isArray(data) ? data : [];
    if (!candidates.length) {
      continue;
    }

    const best = candidates
      .map((candidate) => ({ candidate, score: scoreCandidate(candidate, normalizedDistrict, normalizedDs) }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score < 3) {
      continue;
    }

    const lat = Number(best.candidate.lat);
    const lng = Number(best.candidate.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, query, score: best.score, display_name: best.candidate.display_name };
    }
  }

  return null;
}

async function main() {
  const source = fs.readFileSync(constantsPath, 'utf8');
  const dsByDistrict = extractDsDivisionsByDistrict(source);
  const districts = Object.keys(dsByDistrict);

  const report = {
    generatedAt: new Date().toISOString(),
    districtCount: districts.length,
    dsDivisionCount: 0,
    resolvedCount: 0,
    unresolvedCount: 0,
    entries: [],
  };

  for (const district of districts) {
    const divisions = dsByDistrict[district];
    report.dsDivisionCount += divisions.length;

    for (const dsDivision of divisions) {
      const resolved = await resolveDsDivisionCenter(district, dsDivision);
      const fallbackDistrictCenter = getDistrictCenter(district);
      const ok = Boolean(resolved);

      report.entries.push({
        district,
        dsDivision,
        ok,
        lat: resolved?.lat ?? null,
        lng: resolved?.lng ?? null,
        query: resolved?.query ?? null,
        score: resolved?.score ?? null,
        display_name: resolved?.display_name ?? null,
        fallbackDistrictCenter,
      });

      if (ok) {
        report.resolvedCount += 1;
        console.log(`RESOLVED ${district} / ${dsDivision}`);
      } else {
        report.unresolvedCount += 1;
        console.log(`UNRESOLVED ${district} / ${dsDivision}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`WROTE ${reportPath}`);
  console.log(`TOTAL ${report.dsDivisionCount} RESOLVED ${report.resolvedCount} UNRESOLVED ${report.unresolvedCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
