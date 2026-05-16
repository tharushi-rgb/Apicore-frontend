import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = 'd:/Apicore';
const sourcePath = path.join(repoRoot, 'src', 'app', 'constants', 'sriLankaLocations.ts');
const reportPath = path.join(repoRoot, 'ds_validation_report.json');

function loadDsMap() {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const match = source.match(/export const DS_DIVISIONS_BY_DISTRICT: Record<string, string\[]> = \{([\s\S]*?)\};\n\nexport const DISTRICT_CENTERS/);
  if (!match) {
    throw new Error('Could not parse DS_DIVISIONS_BY_DISTRICT from sriLankaLocations.ts');
  }

  return vm.runInNewContext(`({${match[1]}})`, {});
}

function scoreCandidate(candidate, district, dsDivision) {
  const normalizedDistrict = district.trim().toLowerCase();
  const normalizedDs = dsDivision.trim().toLowerCase();
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

async function resolveFromApi(district, dsDivision) {
  const queries = [
    `${dsDivision} Divisional Secretariat, ${district} District, Sri Lanka`,
    `${dsDivision} DS Division, ${district} District, Sri Lanka`,
    `${dsDivision}, ${district}, Sri Lanka`,
  ];

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
        'user-agent': 'ApicoreDSResolverValidation/1.0 (local validation)',
      },
    });

    if (!response.ok) continue;

    const data = await response.json();
    const candidates = Array.isArray(data) ? data : [];
    if (!candidates.length) continue;

    const best = candidates
      .map((candidate) => ({ candidate, score: scoreCandidate(candidate, district, dsDivision) }))
      .sort((a, b) => b.score - a.score)[0];

    if (!best || best.score < 3) continue;

    const lat = Number(best.candidate?.lat);
    const lng = Number(best.candidate?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    return {
      lat,
      lng,
      label: String(best.candidate?.display_name || '').slice(0, 120),
      score: best.score,
      query,
    };
  }

  return null;
}

async function main() {
  const dsByDistrict = loadDsMap();
  const report = [];
  let total = 0;
  let passed = 0;
  let failed = 0;

  for (const [district, dsList] of Object.entries(dsByDistrict)) {
    for (const dsDivision of dsList) {
      total += 1;
      try {
        const result = await resolveFromApi(district, dsDivision);
        const ok = !!result;
        if (ok) passed += 1; else failed += 1;
        report.push({ district, dsDivision, ok, ...result });
        process.stdout.write(`${ok ? 'OK' : 'FAIL'} ${district} / ${dsDivision}\n`);
      } catch (error) {
        failed += 1;
        report.push({ district, dsDivision, ok: false, error: String(error?.message || error) });
        process.stdout.write(`ERR ${district} / ${dsDivision}\n`);
      }
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
  }

  fs.writeFileSync(reportPath, JSON.stringify({ total, passed, failed, report }, null, 2));
  process.stdout.write(`DONE total=${total} passed=${passed} failed=${failed}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
