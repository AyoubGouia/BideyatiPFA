/**
 * normalizeUniversites.js
 * Plain Node.js script — no TypeScript compiler needed.
 * Run: node scripts/normalizeUniversites.js
 */

const fs = require("fs");
const path = require("path");

// ─── Region taxonomy ──────────────────────────────────────────────────────────
const REGION_MAP = {
  "Tunis": "Grand Tunis",
  "Ariana": "Grand Tunis",
  "Ben Arous": "Grand Tunis",
  "Manouba": "Grand Tunis",
  "La Mannouba": "Grand Tunis",
  "Bizerte": "Nord",
  "Béja": "Nord",
  "Beja": "Nord",
  "Jendouba": "Nord",
  "Le Kef": "Nord",
  "Kef": "Nord",
  "Siliana": "Nord",
  "Zaghouan": "Nord",
  "Nabeul": "Nord",
  "Sousse": "Centre",
  "Monastir": "Centre",
  "Mahdia": "Centre",
  "Kairouan": "Centre",
  "Kasserine": "Centre",
  "Sidi Bouzid": "Centre",
  "Sfax": "Sud",
  "Gabès": "Sud",
  "Gabes": "Sud",
  "Médenine": "Sud",
  "Medenine": "Sud",
  "Tataouine": "Sud",
  "Gafsa": "Sud",
  "Tozeur": "Sud",
  "Kébili": "Sud",
  "Kebili": "Sud",
};

function getRegion(gouvernorat) {
  return REGION_MAP[gouvernorat] || "Autre";
}

function parseRaw(filePath, fields) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return raw.records.map((row) => {
    const obj = {};
    fields.forEach((f, i) => { obj[f] = row[i]; });
    return obj;
  });
}

function mostCommon(arr) {
  if (!arr.length) return null;
  const freq = {};
  for (const v of arr) if (v) freq[v] = (freq[v] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? sorted[0][0] : null;
}

function extractCityFromAdresse(adresse) {
  if (!adresse) return null;
  const match = adresse.match(/\d{4}\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s[A-ZÀ-Ü][a-zà-ü]+)*)/);
  return match ? match[1] : null;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const rawDir = path.join(root, "data", "raw");
  const outDir = path.join(root, "data", "normalized");
  fs.mkdirSync(outDir, { recursive: true });

  const rawUnivs = parseRaw(
    path.join(rawDir, "2622395c-cee6-4a7d-987f-2498bf974686.json"),
    ["_id", "code", "university_fr", "university_ar", "siteweb", "adresse", "fax", "tel"]
  );

  const rawEtabs = parseRaw(
    path.join(rawDir, "b1ca9192-0eda-4d63-94d9-cb7f7245d420.json"),
    ["_id", "etablissement_code", "university_code", "label_ar", "label_fr", "website", "gouvernorat", "type", "lat", "lon"]
  );

  // Build map: university_code → list of gouvernorats
  const univGouvernorats = {};
  for (const e of rawEtabs) {
    const uc = e.university_code;
    if (!univGouvernorats[uc]) univGouvernorats[uc] = [];
    if (e.gouvernorat) univGouvernorats[uc].push(e.gouvernorat);
  }

  // Normalize Universites
  const universites = rawUnivs.map((u) => {
    const code = u.code;
    const gouvernorats = univGouvernorats[code] || [];
    const ville =
      mostCommon(gouvernorats) ||
      extractCityFromAdresse(u.adresse || "") ||
      "Unknown";
    const region = getRegion(ville);

    return {
      id: String(code),
      code,
      nom: String(u.university_fr).trim(),
      nomAr: u.university_ar ? String(u.university_ar).trim() : null,
      siteweb: u.siteweb || null,
      adresse: u.adresse || null,
      ville,
      region,
      description: null,
    };
  });

  // Normalize Etablissements
  const knownUnivCodes = new Set(rawUnivs.map((u) => String(u.code)));

  const etablissements = rawEtabs
    .filter((e) => knownUnivCodes.has(String(e.university_code)))
    .map((e) => ({
      id: String(e.etablissement_code),
      code: e.etablissement_code,
      nom: String(e.label_fr).trim(),
      nomAr: e.label_ar ? String(e.label_ar).trim() : null,
      website: e.website || null,
      gouvernorat: e.gouvernorat || null,
      type: e.type || null,
      lat: e.lat != null ? e.lat : null,
      lon: e.lon != null ? e.lon : null,
      universiteId: String(e.university_code),
    }));

  fs.writeFileSync(path.join(outDir, "universites.json"), JSON.stringify(universites, null, 2), "utf-8");
  fs.writeFileSync(path.join(outDir, "etablissements.json"), JSON.stringify(etablissements, null, 2), "utf-8");

  console.log(`✅ ${universites.length} universities → data/normalized/universites.json`);
  console.log(`✅ ${etablissements.length} etablissements → data/normalized/etablissements.json`);

  const regionCount = {};
  universites.forEach((u) => { regionCount[u.region] = (regionCount[u.region] || 0) + 1; });
  console.log("\n🗺️  University region distribution:");
  Object.entries(regionCount).forEach(([r, c]) => console.log(`   ${String(c).padStart(3)}  ${r}`));
}

main();
