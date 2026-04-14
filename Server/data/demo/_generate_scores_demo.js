const fs = require("fs");
const path = require("path");

const demoDir = __dirname;
const specialitesPath = path.join(demoDir, "specialites.demo.json");
const etablissementsPath = path.join(demoDir, "etablissements.demo.json");
const outputPath = path.join(demoDir, "scores.demo.json");

const YEARS = [2023, 2024, 2025];
const SECTIONS = {
  LETTRES: "آداب",
  MATH: "رياضيات",
  SCIENCES: "علوم تجريبية",
  ECO: "إقتصاد وتصرف",
  INFO: "علوم الإعلامية",
  TECH: "العلوم التقنية",
  SPORT: "رياضة",
};

const BAND_BY_TIER = {
  A: {
    2023: [175, 192],
    2024: [178, 195],
    2025: [180, 197],
  },
  B: {
    2023: [145, 175],
    2024: [148, 178],
    2025: [150, 180],
  },
  C: {
    2023: [120, 150],
    2024: [123, 153],
    2025: [125, 155],
  },
  D: {
    2023: [95, 125],
    2024: [98, 128],
    2025: [100, 130],
  },
};

const BASE_BY_TIER = {
  A: { 2023: 181, 2024: 184, 2025: 186 },
  B: { 2023: 156, 2024: 159, 2025: 162 },
  C: { 2023: 133, 2024: 136, 2025: 138 },
  D: { 2023: 108, 2024: 111, 2025: 114 },
};

const SCHOOL_TIER_OVERRIDES = {
  "304": "A",
  "703": "A",
  "803": "A",
  "1005": "A",
  "311": "A",
  "423": "A",
  "430": "A",
  "1011": "A",
  "308": "A",
  "510": "A",
  "212": "B",
  "407": "B",
  "711": "B",
  "714": "B",
  "715": "B",
  "815": "B",
  "905": "B",
  "1017": "B",
  "1115": "B",
  "215": "B",
  "301": "C",
  "204": "C",
  "427": "C",
  "502": "C",
  "601": "C",
  "1110": "C",
  "1324": "C",
  "1501": "C",
  "102": "D",
  "1204": "D",
};

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function slug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hashInt(value) {
  const input = String(value);
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundScore(value) {
  return Math.round(value * 1000) / 1000;
}

function bumpTier(tier) {
  if (tier === "D") return "C";
  if (tier === "C") return "B";
  return "A";
}

function lowerTier(tier) {
  if (tier === "A") return "B";
  if (tier === "B") return "C";
  return "D";
}

function classifySpecialty(spec) {
  const name = slug(spec.nomSpecialite);
  const type = slug(spec.typeSpecialite);
  const etabId = String(spec.etablissementId);
  const schoolTier = SCHOOL_TIER_OVERRIDES[etabId] || "C";

  const has = (...parts) => parts.some((part) => name.includes(part));

  if (has("medecine")) {
    return { domain: "medicine", tier: "A" };
  }

  if (
    has(
      "biomedical",
      "biotechnologie medicale",
      "technologies de la sante",
      "genie biologique",
      "maintenance biomedicale",
      "sante publique"
    )
  ) {
    const tier = schoolTier === "A" ? "B" : schoolTier;
    return { domain: "health-tech", tier };
  }

  if (type.includes("ingenieur")) {
    if (
      has(
        "telecommunication",
        "reseaux",
        "systemes de communication",
        "informatique",
        "electronique"
      )
    ) {
      return {
        domain: "engineering-digital",
        tier: schoolTier === "A" ? "A" : "B",
      };
    }

    return { domain: "engineering", tier: schoolTier === "A" ? "A" : "B" };
  }

  if (
    has(
      "intelligence artificielle",
      "data science",
      "sciences de l'informatique",
      "systemes informatiques",
      "systemes d'information",
      "internet des objets",
      "systemes embarques",
      "applications web",
      "reseaux informatiques",
      "services numeriques",
      "technologies de l'information",
      "multimedia educatif",
      "informatique de gestion",
      "telecommunication"
    )
  ) {
    const tier = schoolTier === "A" ? "A" : schoolTier === "B" ? "B" : "C";
    return { domain: "it", tier };
  }

  if (has("education physique", "entrainement sportif", "management du sport")) {
    return { domain: "sport", tier: "D" };
  }

  if (
    has(
      "administration des affaires",
      "finance",
      "marketing",
      "gestion",
      "economique"
    )
  ) {
    return { domain: "business", tier: schoolTier === "B" ? "B" : "C" };
  }

  if (has("journalisme", "presse", "communication des medias")) {
    return { domain: "media", tier: "C" };
  }

  if (has("audiovisuel", "cinematographique", "postproduction")) {
    return { domain: "audiovisual", tier: "C" };
  }

  if (has("arts plastiques", "design graphique", "communication visuelle")) {
    return { domain: "arts", tier: "C" };
  }

  if (has("mathematiques", "physique", "sciences de la vie")) {
    return { domain: "sciences", tier: "C" };
  }

  if (has("civilisation islamique", "pensee islamique", "droit")) {
    return { domain: "humanities", tier: "D" };
  }

  return { domain: "general", tier: lowerTier(schoolTier) };
}

function relevantSections(spec, classification) {
  const name = slug(spec.nomSpecialite);

  if (classification.domain === "medicine") {
    return [SECTIONS.SCIENCES, SECTIONS.MATH, SECTIONS.TECH];
  }

  if (classification.domain === "health-tech") {
    return [SECTIONS.SCIENCES, SECTIONS.MATH, SECTIONS.TECH, SECTIONS.INFO];
  }

  if (classification.domain === "engineering" || classification.domain === "engineering-digital") {
    return [SECTIONS.MATH, SECTIONS.TECH, SECTIONS.SCIENCES, SECTIONS.INFO];
  }

  if (classification.domain === "it") {
    if (name.includes("gestion") || name.includes("systemes d'information")) {
      return [SECTIONS.INFO, SECTIONS.MATH, SECTIONS.ECO, SECTIONS.TECH];
    }
    return [SECTIONS.INFO, SECTIONS.MATH, SECTIONS.TECH, SECTIONS.SCIENCES];
  }

  if (classification.domain === "business") {
    if (name.includes("gestion")) {
      return [SECTIONS.ECO, SECTIONS.INFO, SECTIONS.MATH, SECTIONS.SCIENCES];
    }
    return [SECTIONS.ECO, SECTIONS.MATH, SECTIONS.INFO, SECTIONS.SCIENCES];
  }

  if (classification.domain === "media") {
    return [SECTIONS.LETTRES, SECTIONS.INFO, SECTIONS.ECO, SECTIONS.SCIENCES];
  }

  if (classification.domain === "audiovisual" || classification.domain === "arts") {
    return [SECTIONS.LETTRES, SECTIONS.INFO, SECTIONS.ECO];
  }

  if (classification.domain === "sciences") {
    return [SECTIONS.MATH, SECTIONS.SCIENCES, SECTIONS.TECH];
  }

  if (classification.domain === "humanities") {
    return [SECTIONS.LETTRES, SECTIONS.ECO, SECTIONS.SCIENCES];
  }

  if (classification.domain === "sport") {
    return [SECTIONS.SPORT, SECTIONS.SCIENCES, SECTIONS.LETTRES];
  }

  return [SECTIONS.MATH, SECTIONS.SCIENCES, SECTIONS.ECO];
}

function sectionBonus(section, classification, spec) {
  const name = slug(spec.nomSpecialite);

  const maps = {
    medicine: {
      [SECTIONS.SCIENCES]: 6.0,
      [SECTIONS.MATH]: 3.6,
      [SECTIONS.TECH]: -2.8,
    },
    "health-tech": {
      [SECTIONS.SCIENCES]: 5.4,
      [SECTIONS.MATH]: 3.0,
      [SECTIONS.TECH]: 1.6,
      [SECTIONS.INFO]: -1.2,
    },
    engineering: {
      [SECTIONS.MATH]: 5.4,
      [SECTIONS.TECH]: 5.0,
      [SECTIONS.SCIENCES]: 2.6,
      [SECTIONS.INFO]: 1.4,
    },
    "engineering-digital": {
      [SECTIONS.MATH]: 5.6,
      [SECTIONS.TECH]: 4.8,
      [SECTIONS.INFO]: 3.8,
      [SECTIONS.SCIENCES]: 2.2,
    },
    it: {
      [SECTIONS.INFO]: 5.8,
      [SECTIONS.MATH]: 4.4,
      [SECTIONS.TECH]: 2.8,
      [SECTIONS.SCIENCES]: 1.6,
      [SECTIONS.ECO]: 1.2,
    },
    business: {
      [SECTIONS.ECO]: 5.8,
      [SECTIONS.MATH]: 3.8,
      [SECTIONS.INFO]: 2.8,
      [SECTIONS.SCIENCES]: 1.6,
    },
    media: {
      [SECTIONS.LETTRES]: 5.8,
      [SECTIONS.INFO]: 3.8,
      [SECTIONS.ECO]: 2.6,
      [SECTIONS.SCIENCES]: 1.0,
    },
    audiovisual: {
      [SECTIONS.LETTRES]: 5.2,
      [SECTIONS.INFO]: 4.0,
      [SECTIONS.ECO]: 1.8,
    },
    arts: {
      [SECTIONS.LETTRES]: 5.6,
      [SECTIONS.INFO]: 3.4,
      [SECTIONS.ECO]: 1.8,
    },
    sciences: {
      [SECTIONS.MATH]: 5.2,
      [SECTIONS.SCIENCES]: 5.0,
      [SECTIONS.TECH]: 1.4,
    },
    humanities: {
      [SECTIONS.LETTRES]: 5.8,
      [SECTIONS.ECO]: 2.4,
      [SECTIONS.SCIENCES]: 0.8,
    },
    sport: {
      [SECTIONS.SPORT]: 6.6,
      [SECTIONS.SCIENCES]: 2.0,
      [SECTIONS.LETTRES]: 1.2,
    },
    general: {
      [SECTIONS.MATH]: 3.0,
      [SECTIONS.SCIENCES]: 3.0,
      [SECTIONS.ECO]: 2.0,
    },
  };

  let bonus = (maps[classification.domain] || maps.general)[section] || 0;

  if (classification.domain === "it" && name.includes("intelligence artificielle")) {
    if (section === SECTIONS.MATH || section === SECTIONS.INFO) bonus += 1.8;
  }

  if (classification.domain === "it" && name.includes("data science")) {
    if (section === SECTIONS.MATH) bonus += 1.4;
    if (section === SECTIONS.INFO) bonus += 0.8;
  }

  if (classification.domain === "business" && name.includes("finance")) {
    if (section === SECTIONS.MATH) bonus += 1.0;
  }

  if (classification.domain === "media" && name.includes("presse numerique")) {
    if (section === SECTIONS.INFO) bonus += 1.0;
  }

  return bonus;
}

function reputationBonus(spec, classification) {
  const schoolTier = SCHOOL_TIER_OVERRIDES[String(spec.etablissementId)] || classification.tier;
  if (schoolTier === "A") return 2.6;
  if (schoolTier === "B") return 1.2;
  if (schoolTier === "C") return 0;
  return -0.8;
}

function specialtyBonus(spec, classification) {
  const name = slug(spec.nomSpecialite);
  let bonus = 0;

  if (classification.domain === "medicine") bonus += 3.6;
  if (classification.domain === "engineering-digital") bonus += 1.6;
  if (classification.domain === "engineering") bonus += 1.0;
  if (classification.domain === "it") bonus += 1.0;
  if (classification.domain === "business" && name.includes("finance")) bonus += 1.6;
  if (classification.domain === "business" && name.includes("marketing")) bonus += 0.4;
  if (classification.domain === "audiovisual" || classification.domain === "arts") bonus -= 0.8;
  if (classification.domain === "humanities") bonus -= 1.2;
  if (classification.domain === "sport") bonus -= 1.6;

  if (name.includes("telecommunication")) bonus += 0.8;
  if (name.includes("cyber") || name.includes("securite")) bonus += 1.2;
  if (name.includes("data")) bonus += 1.0;
  if (name.includes("internet des objets") || name.includes("systemes embarques")) bonus += 0.8;

  return bonus;
}

function rowScore(spec, classification, year, section) {
  const band = BAND_BY_TIER[classification.tier][year];
  const base = BASE_BY_TIER[classification.tier][year];
  const bonus =
    reputationBonus(spec, classification) +
    specialtyBonus(spec, classification) +
    sectionBonus(section, classification, spec);

  const seed = hashInt(`${spec.codeOrientation}-${year}-${section}`);
  const specialtyDrift = ((hashInt(spec.codeOrientation) % 700) / 700 - 0.5) * 3.0;
  const jitter = ((seed % 1000) / 1000 - 0.5) * 1.8;

  const score = clamp(base + bonus + specialtyDrift + jitter, band[0], band[1]);
  return roundScore(score);
}

function main() {
  const specialites = readJson(specialitesPath);
  const etablissements = readJson(etablissementsPath);
  const etabById = new Map(etablissements.map((etab) => [String(etab.id), etab]));

  const rows = [];
  const keys = new Set();
  const missingEtab = [];

  for (const spec of specialites) {
    const etab = etabById.get(String(spec.etablissementId));
    if (!etab) {
      missingEtab.push(spec.codeOrientation);
      continue;
    }

    const classification = classifySpecialty(spec);
    const sections = relevantSections(spec, classification);

    for (const year of YEARS) {
      for (const section of sections) {
        const key = `${year}-${spec.codeOrientation}-${section}`;
        if (keys.has(key)) {
          throw new Error(`Duplicate row key detected: ${key}`);
        }

        keys.add(key);
        rows.push({
          annee: year,
          codeOrientation: String(spec.codeOrientation),
          establishment_name: etab.nom,
          city: etab.gouvernorat,
          specialty_name: spec.nomSpecialite,
          sectionBac: section,
          scoreDernierAdmis: rowScore(spec, classification, year, section),
        });
      }
    }
  }

  if (missingEtab.length > 0) {
    throw new Error(`Missing demo establishments for codes: ${missingEtab.join(", ")}`);
  }

  writeJson(outputPath, rows);

  const sectionsUsed = [...new Set(rows.map((row) => row.sectionBac))];
  const specialtiesCovered = new Set(rows.map((row) => row.codeOrientation)).size;

  console.log(`Generated ${rows.length} score rows`);
  console.log(`Specialties covered: ${specialtiesCovered}`);
  console.log(`Years: ${YEARS.join(", ")}`);
  console.log(`Sections used: ${sectionsUsed.join(" | ")}`);
}

main();
