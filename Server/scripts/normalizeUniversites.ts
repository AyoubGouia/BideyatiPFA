/**
 * normalizeUniversites.ts
 * Reads raw JSON files and writes normalized JSON to data/normalized/
 *
 * Run: node_modules/.bin/ts-node --transpile-only --skip-project scripts/normalizeUniversites.ts
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import * as fs from "fs";
import * as path from "path";

// ─── Region taxonomy ──────────────────────────────────────────────────────────
const REGION_MAP: Record<string, string> = {
  Tunis: "Grand Tunis",
  Ariana: "Grand Tunis",
  "Ben Arous": "Grand Tunis",
  Manouba: "Grand Tunis",
  "La Mannouba": "Grand Tunis",
  Bizerte: "Nord",
  "Béja": "Nord",
  Beja: "Nord",
  Jendouba: "Nord",
  "Le Kef": "Nord",
  Kef: "Nord",
  Siliana: "Nord",
  Zaghouan: "Nord",
  Nabeul: "Nord",
  Sousse: "Centre",
  Monastir: "Centre",
  Mahdia: "Centre",
  Kairouan: "Centre",
  Kasserine: "Centre",
  "Sidi Bouzid": "Centre",
  Sfax: "Sud",
  "Gabès": "Sud",
  Gabes: "Sud",
  "Médenine": "Sud",
  Medenine: "Sud",
  Tataouine: "Sud",
  Gafsa: "Sud",
  Tozeur: "Sud",
  "Kébili": "Sud",
  Kebili: "Sud",
};

function getRegion(gouvernorat: string): string {
  return REGION_MAP[gouvernorat] ?? "Autre";
}

// ─── Parse raw array-of-arrays JSON ──────────────────────────────────────────
function parseRaw(filePath: string, fields: string[]): Record<string, unknown>[] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    records: unknown[][];
  };
  return raw.records.map((row) => {
    const obj: Record<string, unknown> = {};
    fields.forEach((f, i) => { obj[f] = row[i]; });
    return obj;
  });
}

function mostCommon(arr: string[]): string | null {
  if (!arr.length) return null;
  const freq: Record<string, number> = {};
  for (const v of arr) if (v) freq[v] = (freq[v] ?? 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function extractCityFromAdresse(adresse: string): string | null {
  const match = adresse.match(/\d{4}\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s[A-ZÀ-Ü][a-zà-ü]+)*)/);
  return match?.[1] ?? null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main(): void {
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
  const univGouvernorats: Record<number, string[]> = {};
  for (const e of rawEtabs) {
    const uc = e.university_code as number;
    if (!univGouvernorats[uc]) univGouvernorats[uc] = [];
    if (e.gouvernorat) univGouvernorats[uc].push(e.gouvernorat as string);
  }

  // ── Normalize Universites ──────────────────────────────────────────────────
  const universites = rawUnivs.map((u) => {
    const code = u.code as number;
    const gouvernorats = univGouvernorats[code] ?? [];
    const ville =
      mostCommon(gouvernorats) ??
      extractCityFromAdresse((u.adresse as string) ?? "") ??
      "Unknown";
    const region = getRegion(ville);

    return {
      id: String(code),
      code,
      nom: (u.university_fr as string).trim(),
      nomAr: (u.university_ar as string)?.trim() ?? null,
      siteweb: (u.siteweb as string) || null,
      adresse: (u.adresse as string) || null,
      ville,
      region,
      description: null as string | null,
    };
  });

  // ── Normalize Etablissements ───────────────────────────────────────────────
  const knownUnivCodes = new Set(rawUnivs.map((u) => String(u.code as number)));

  const etablissements = rawEtabs
    .filter((e) => knownUnivCodes.has(String(e.university_code as number)))
    .map((e) => ({
      id: String(e.etablissement_code as number),
      code: e.etablissement_code as number,
      nom: (e.label_fr as string).trim(),
      nomAr: (e.label_ar as string)?.trim() ?? null,
      website: (e.website as string) || null,
      gouvernorat: (e.gouvernorat as string) || null,
      type: (e.type as string) || null,
      lat: e.lat != null ? (e.lat as number) : null,
      lon: e.lon != null ? (e.lon as number) : null,
      universiteId: String(e.university_code as number),
    }));

  fs.writeFileSync(path.join(outDir, "universites.json"), JSON.stringify(universites, null, 2), "utf-8");
  fs.writeFileSync(path.join(outDir, "etablissements.json"), JSON.stringify(etablissements, null, 2), "utf-8");

  console.log(`✅ ${universites.length} universities → data/normalized/universites.json`);
  console.log(`✅ ${etablissements.length} etablissements → data/normalized/etablissements.json`);

  const regionCount: Record<string, number> = {};
  universites.forEach((u) => { regionCount[u.region] = (regionCount[u.region] ?? 0) + 1; });
  console.log("\n🗺️  University region distribution:");
  Object.entries(regionCount).forEach(([r, c]) => console.log(`   ${String(c).padStart(3)}  ${r}`));
}

main();
