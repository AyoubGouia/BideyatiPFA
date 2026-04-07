import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function readJsonFile<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error);
    return [];
  }
}

function normalizeLabel(label: string): string {
  if (!label) return "";
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")                    // collapse repeated spaces
    .replace(/[()]/g, "")                    // remove parentheses
    .replace(/[,؛:/](?!\s)/g, "")             // remove punctuation (except spaced)
    .trim();
}

function deduplicateBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper: Try to find establishment by partial name matching
function findEstablishmentByPartialMatch(
  targetName: string,
  normMap: Map<string, string>
): string | null {
  const targetNorm = normalizeLabel(targetName);
  
  // Exact match first
  if (normMap.has(targetNorm)) {
    return normMap.get(targetNorm) || null;
  }

  // Partial match: find an entry that contains all significant words from target
  const targetWords = targetNorm.split(/\s+/).filter(w => w.length > 2);
  if (targetWords.length === 0) return null;

  for (const [normKey, id] of normMap.entries()) {
    const keyWords = normKey.split(/\s+/);
    // Check if most target words appear in this establishment name
    const matchCount = targetWords.filter(w => keyWords.some(kw => kw.includes(w) || w.includes(kw))).length;
    if (matchCount >= Math.ceil(targetWords.length * 0.6)) {
      // At least 60% of target words match
      return id;
    }
  }

  return null;
}

// ============================================================================
// STATISTICS TRACKER
// ============================================================================

type TableStats = {
  processed: number;
  skipped: number;
  unresolved?: number;
};

const stats = {
  universite: { processed: 0, skipped: 0 },
  etablissement: { processed: 0, skipped: 0 },
  section: { processed: 0, skipped: 0 },
  specialite: { processed: 0, skipped: 0, unresolved: 0 },
  statistiqueAdmission: { processed: 0, skipped: 0, unresolved: 0 },
  capaciteAdmission: { processed: 0, skipped: 0, unresolved: 0 },
};

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log("\n🌱 Starting Bideyati seed script...\n");

  // Adjust these paths if your data directory structure is different
  const DATA_DIR = path.join(__dirname, "../data");

  // ========================================
  // 1. SEED UNIVERSITE
  // ========================================
  console.log("📚 Seeding Universite...");
  const universities = readJsonFile<any>(
    path.join(DATA_DIR, "normalized/universites.json")
  );

  for (const uni of universities) {
    try {
      await prisma.universite.upsert({
        where: { id: uni.id },
        update: {
          nom: uni.nom,
          nomAr: uni.nomAr || null,
          code: uni.code || null,
          siteweb: uni.siteweb || null,
          adresse: uni.adresse || null,
          ville: uni.ville,
          region: uni.region,
          description: uni.description || null,
        },
        create: {
          id: uni.id,
          nom: uni.nom,
          nomAr: uni.nomAr || null,
          code: uni.code || null,
          siteweb: uni.siteweb || null,
          adresse: uni.adresse || null,
          ville: uni.ville,
          region: uni.region,
          description: uni.description || null,
        },
      });
      stats.universite.processed++;
    } catch (error) {
      console.error(`  ❌ Failed for ID ${uni.id}:`, (error as any).message);
      stats.universite.skipped++;
    }
  }
  console.log(`  ✓ Processed ${universities.length} universities\n`);

  // ========================================
  // 2. SEED ETABLISSEMENT
  // ========================================
  console.log("🏢 Seeding Etablissement...");
  const etablissements = readJsonFile<any>(
    path.join(DATA_DIR, "normalized/etablissements.json")
  );

  for (const etab of etablissements) {
    try {
      await prisma.etablissement.upsert({
        where: { id: etab.id },
        update: {
          code: etab.code,
          nom: etab.nom,
          nomAr: etab.nomAr || null,
          website: etab.website || null,
          gouvernorat: etab.gouvernorat || null,
          type: etab.type || null,
          lat: etab.lat || null,
          lon: etab.lon || null,
          universiteId: etab.universiteId,
        },
        create: {
          id: etab.id,
          code: etab.code,
          nom: etab.nom,
          nomAr: etab.nomAr || null,
          website: etab.website || null,
          gouvernorat: etab.gouvernorat || null,
          type: etab.type || null,
          lat: etab.lat || null,
          lon: etab.lon || null,
          universiteId: etab.universiteId,
        },
      });
      stats.etablissement.processed++;
    } catch (error) {
      console.error(`  ❌ Failed for ID ${etab.id}:`, (error as any).message);
      stats.etablissement.skipped++;
    }
  }
  console.log(`  ✓ Processed ${etablissements.length} établissements\n`);

  // ========================================
  // 3. SEED SECTION (7 Bac Sections)
  // ========================================
  console.log("📖 Seeding Section (bac sections)...");
  const sectionNames = [
    "آداب",
    "رياضيات",
    "علوم تجريبية",
    "إقتصاد وتصرف",
    "علوم الإعلامية",
    "العلوم التقنية",
    "رياضة",
  ];
  const sectionMap = new Map<string, string>(); // normalized name -> id

  for (const sectionName of sectionNames) {
    try {
      const section = await prisma.section.upsert({
        where: { nom: sectionName },
        update: {},
        create: { nom: sectionName },
      });
      sectionMap.set(normalizeLabel(sectionName), section.id);
      stats.section.processed++;
    } catch (error) {
      console.error(
        `  ❌ Failed for section "${sectionName}":`,
        (error as any).message
      );
      stats.section.skipped++;
    }
  }
  console.log(`  ✓ Processed ${sectionNames.length} sections\n`);

  // ========================================
  // 4. BUILD CODE-TO-ESTABLISHMENT MAPPING
  // ========================================
  console.log("🔗 Building codeOrientation -> Etablissement mapping...");
  const codeToEstablishment = new Map<string, string>(); // code -> establishment name

  const scoreFiles = [
    path.join(DATA_DIR, "normalized/2023/scores_2023_reference.by_section.json"),
    path.join(
      DATA_DIR,
      "normalized/2024/scores_2024_reference.by_section.json"
    ),
    path.join(DATA_DIR, "normalized/2025/scores_2025.by_section.json"),
  ];

  // Pre-load capacity file for reuse
  const capacityFile = path.join(
    DATA_DIR,
    "normalized/2025/capacities_2025.by_section.json"
  );
  const capacityDataAll = readJsonFile<any>(capacityFile);

  for (const scoreFile of scoreFiles) {
    const scores = readJsonFile<any>(scoreFile);
    for (const score of scores) {
      if (
        score.codeOrientation &&
        !codeToEstablishment.has(score.codeOrientation)
      ) {
        codeToEstablishment.set(score.codeOrientation, score.establishment_name);
      }
    }
  }

  // Also populate from capacity file to fill gaps for codes only in capacities
  for (const cap of capacityDataAll) {
    if (
      cap.codeOrientation &&
      cap.establishment_name &&
      !codeToEstablishment.has(cap.codeOrientation)
    ) {
      codeToEstablishment.set(cap.codeOrientation, cap.establishment_name);
    }
  }

  console.log(
    `  ✓ Mapped ${codeToEstablishment.size} codeOrientation entries\n`
  );

  // ========================================
  // 4B. PRELOAD ETABLISSEMENTS FOR MAPPING
  // ========================================
  const allEtablissements = await prisma.etablissement.findMany({
    select: { id: true, nom: true, nomAr: true },
  });
  const etablissementNormMap = new Map<string, string>(); // normalized name -> id
  for (const etab of allEtablissements) {
    if (etab.nom) {
      etablissementNormMap.set(normalizeLabel(etab.nom), etab.id);
    }
    if (etab.nomAr) {
      etablissementNormMap.set(normalizeLabel(etab.nomAr), etab.id);
    }
  }

  // ========================================
  // 4C. BUILD UNIQUE CODEORIENTATION SET FROM EXTRACTED DATA
  // ========================================
  console.log("📊 Extracting unique codeOrientation from all score/capacity files...");
  const uniqueCodesMap = new Map<string, any>(); // codeOrientation -> { code, specialty_name, formuleBrute? }

  // Extract from all score files
  for (const scoreFile of scoreFiles) {
    const scores = readJsonFile<any>(scoreFile);
    for (const score of scores) {
      if (score.codeOrientation && !uniqueCodesMap.has(score.codeOrientation)) {
        uniqueCodesMap.set(score.codeOrientation, {
          code: score.codeOrientation,
          specialty_name: score.specialty_name || "",
        });
      }
    }
  }

  // Extract from capacity file (reuse already-loaded data)
  for (const cap of capacityDataAll) {
    if (cap.codeOrientation && !uniqueCodesMap.has(cap.codeOrientation)) {
      uniqueCodesMap.set(cap.codeOrientation, {
        code: cap.codeOrientation,
        specialty_name: cap.specialty_name || "",
      });
    }
  }
  console.log(`  ✓ Found ${uniqueCodesMap.size} unique codeOrientation values\n`);

  // ========================================
  // 5. SEED SPECIALITE FROM EXTRACTED DATA (WITH ENRICHMENT)
  // ========================================
  console.log("🎓 Seeding Specialite from extracted data...");

  // Load enrichment data from sample file
  const enrichmentData = readJsonFile<any>(
    path.join(DATA_DIR, "normalized/2025/specialties_base.sample.json")
  );
  const enrichmentMap = new Map<string, any>(); // codeOrientation -> { nom, formuleBrute }
  for (const spec of enrichmentData) {
    if (spec.codeOrientation) {
      enrichmentMap.set(spec.codeOrientation, {
        nom: spec.nom,
        formuleBrute: spec.formuleBrute || null,
      });
    }
  }

  // Seed each unique code as a Specialite
  for (const [code, codeData] of uniqueCodesMap.entries()) {
    try {
      // Determine specialty name: prefer enrichment, fallback to extracted data
      let nom = codeData.specialty_name || "";
      let formuleBrute: string | null = null;

      const enriched = enrichmentMap.get(code);
      if (enriched) {
        nom = enriched.nom || nom; // prefer enriched name if available
        formuleBrute = enriched.formuleBrute;
      }

      // Try to resolve etablissement from mapping
      let etablissementId: string | null = null;
      const establishmentName = codeToEstablishment.get(code);
      if (establishmentName) {
        // Try exact match first
        const normalizedName = normalizeLabel(establishmentName);
        etablissementId = etablissementNormMap.get(normalizedName) || null;
        
        // Fallback: try partial matching if exact fails
        if (!etablissementId) {
          etablissementId = findEstablishmentByPartialMatch(establishmentName, etablissementNormMap);
        }
        
        // Log if still unresolved
        if (!etablissementId) {
          console.warn(
            `  ⚠️  Unresolved establishment for code ${code}: "${establishmentName}"`
          );
          stats.specialite.unresolved = (stats.specialite.unresolved || 0) + 1;
        }
      } else {
        console.warn(`  ⚠️  No establishment mapping for code ${code}`);
        stats.specialite.unresolved = (stats.specialite.unresolved || 0) + 1;
      }

      // Prepare update data - only include etablissementId if non-null to avoid overwriting valid links
      const updateData: any = {
        nom: nom,
        formuleBrute: formuleBrute,
      };
      if (etablissementId !== null) {
        updateData.etablissementId = etablissementId;
      }

      await prisma.specialite.upsert({
        where: { codeOrientation: code },
        update: updateData,
        create: {
          codeOrientation: code,
          nom: nom,
          formuleBrute: formuleBrute,
          etablissementId: etablissementId,
          // universiteId and domaine, scoreMinimum left null as per data
        },
      });
      stats.specialite.processed++;
    } catch (error) {
      console.error(`  ❌ Failed for code ${code}:`, (error as any).message);
      stats.specialite.skipped++;
    }
  }
  console.log(`  ✓ Processed ${uniqueCodesMap.size} specialties\n`);

  // ========================================
  // 5B. PRELOAD SPECIALTIES INTO MAP
  // ========================================
  const allSpecialites = await prisma.specialite.findMany({
    select: { id: true, codeOrientation: true },
  });
  const specialiteMap = new Map<string, string>(); // codeOrientation -> specialiteId
  for (const spec of allSpecialites) {
    specialiteMap.set(spec.codeOrientation, spec.id);
  }

  // ========================================
  // 6. SEED STATISTIQUE ADMISSION
  // ========================================
  console.log("📊 Seeding StatistiqueAdmission...");
  const seenStatistics = new Set<string>();

  for (const scoreFile of scoreFiles) {
    const scores = readJsonFile<any>(scoreFile);
    const dedupedScores = deduplicateBy(
      scores,
      (s) => `${s.annee}-${s.codeOrientation}-${s.sectionBac}`
    );

    for (const row of dedupedScores) {
      try {
        if (!row.codeOrientation || !row.sectionBac) {
          stats.statistiqueAdmission.unresolved++;
          continue;
        }

        // Resolve specialite by codeOrientation
        const specialiteId = specialiteMap.get(row.codeOrientation);
        if (!specialiteId) {
          stats.statistiqueAdmission.unresolved++;
          continue;
        }

        // Resolve section by normalized section name
        const sectionId = sectionMap.get(normalizeLabel(row.sectionBac));
        if (!sectionId) {
          stats.statistiqueAdmission.unresolved++;
          continue;
        }

        // Check for duplicate
        const dupKey = `${row.annee}-${sectionId}-${specialiteId}`;
        if (seenStatistics.has(dupKey)) {
          stats.statistiqueAdmission.skipped++;
          continue;
        }

        await prisma.statistiqueAdmission.upsert({
          where: {
            annee_sectionId_specialiteId: {
              annee: row.annee,
              sectionId: sectionId,
              specialiteId: specialiteId,
            },
          },
          update: {
            scoreDernierAdmis: row.scoreDernierAdmis,
          },
          create: {
            annee: row.annee,
            sectionId: sectionId,
            specialiteId: specialiteId,
            scoreDernierAdmis: row.scoreDernierAdmis,
            // scoreMinimum, tauxAdmission left null
          },
        });

        seenStatistics.add(dupKey);
        stats.statistiqueAdmission.processed++;
      } catch (error) {
        console.error(
          `  ❌ Failed for code ${row.codeOrientation}, section ${row.sectionBac}:`,
          (error as any).message
        );
        stats.statistiqueAdmission.skipped++;
      }
    }
  }
  console.log(`  ✓ Processed StatistiqueAdmission records\n`);

  // ========================================
  // 7. SEED CAPACITE ADMISSION
  // ========================================
  console.log("📈 Seeding CapaciteAdmission...");
  const dedupedCapacities = deduplicateBy(
    capacityDataAll,
    (c) => `${c.annee}-${c.tour}-${c.codeOrientation}-${c.sectionBac}`
  );
  const seenCapacities = new Set<string>();

  for (const row of dedupedCapacities) {
    try {
      if (!row.codeOrientation || !row.sectionBac || !row.tour) {
        stats.capaciteAdmission.unresolved++;
        continue;
      }

      // Resolve specialite by codeOrientation
      const specialiteId = specialiteMap.get(row.codeOrientation);
      if (!specialiteId) {
        stats.capaciteAdmission.unresolved++;
        continue;
      }

      // Resolve section by normalized section name
      const sectionId = sectionMap.get(normalizeLabel(row.sectionBac));
      if (!sectionId) {
        stats.capaciteAdmission.unresolved++;
        continue;
      }

      // Check for duplicate
      const dupKey = `${row.annee}-${row.tour}-${sectionId}-${specialiteId}`;
      if (seenCapacities.has(dupKey)) {
        stats.capaciteAdmission.skipped++;
        continue;
      }

      await prisma.capaciteAdmission.upsert({
        where: {
          annee_tour_sectionId_specialiteId: {
            annee: row.annee,
            tour: row.tour,
            sectionId: sectionId,
            specialiteId: specialiteId,
          },
        },
        update: {
          capacite: row.capacite,
        },
        create: {
          annee: row.annee,
          tour: row.tour,
          sectionId: sectionId,
          specialiteId: specialiteId,
          capacite: row.capacite,
        },
      });

      seenCapacities.add(dupKey);
      stats.capaciteAdmission.processed++;
    } catch (error) {
      console.error(
        `  ❌ Failed for code ${row.codeOrientation}, tour ${row.tour}:`,
        (error as any).message
      );
      stats.capaciteAdmission.skipped++;
    }
  }
  console.log(`  ✓ Processed ${dedupedCapacities.length} capacity records\n`);

  // ========================================
  // PRINT SUMMARY
  // ========================================
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                    🎉 SEED SUMMARY 🎉                     ");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const [table, counts] of Object.entries(stats)) {
    console.log(`${table.padEnd(25)}`);
    console.log(`  Processed: ${counts.processed.toString().padStart(5)}`);
    if (counts.skipped > 0) {
      console.log(`  Skipped:   ${counts.skipped.toString().padStart(5)}`);
    }
    if ("unresolved" in counts && counts.unresolved > 0) {
      console.log(`  Unresolved: ${counts.unresolved.toString().padStart(4)}`);
    }
    console.log();
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ Seed completed successfully!");
  console.log("═══════════════════════════════════════════════════════════\n");
}

// ============================================================================
// RUN SEED
// ============================================================================

main()
  .catch((e) => {
    console.error("\n❌ SEED FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
