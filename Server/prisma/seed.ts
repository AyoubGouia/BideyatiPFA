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
    const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
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
    .replace(/\s+/g, " ")
    .replace(/[()]/g, "")
    .replace(/[,؛:/](?!\s)/g, "")
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
  console.log("\n🌱 Starting Bideyati demo seed...\n");

  const DATA_DIR = path.join(__dirname, "../data/demo");
  const universitiesPath = path.join(DATA_DIR, "universites.demo.json");
  const etablissementsPath = path.join(DATA_DIR, "etablissements.demo.json");
  const specialitesPath = path.join(DATA_DIR, "specialites.demo.json");
  const scoresPath = path.join(DATA_DIR, "scores.demo.json");
  const capacitiesPath = path.join(DATA_DIR, "capacites.demo.json");

  const universities = readJsonFile<any>(universitiesPath);
  const etablissements = readJsonFile<any>(etablissementsPath);
  const specialites = readJsonFile<any>(specialitesPath);
  const scores = readJsonFile<any>(scoresPath);
  const capacities = readJsonFile<any>(capacitiesPath);

  console.log("Using demo files only:");
  console.log(`  ${universitiesPath}`);
  console.log(`  ${etablissementsPath}`);
  console.log(`  ${specialitesPath}`);
  console.log(`  ${scoresPath}`);
  console.log(`  ${capacitiesPath}\n`);

  // ========================================
  // 1. SEED UNIVERSITE
  // ========================================
  console.time("universities");
  console.log("📚 Seeding Universite...");
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
  console.timeEnd("universities");
  console.log(`Universities done: ${universities.length}\n`);

  // ========================================
  // 2. SEED ETABLISSEMENT
  // ========================================
  console.time("establishments");
  console.log("🏢 Seeding Etablissement...");
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
  console.timeEnd("establishments");
  console.log(`Establishments done: ${etablissements.length}\n`);

  // ========================================
  // 3. SEED SECTION
  // ========================================
  console.time("sections");
  console.log("📖 Seeding Section...");
  const sectionNames = [
    "آداب",
    "رياضيات",
    "علوم تجريبية",
    "إقتصاد وتصرف",
    "علوم الإعلامية",
    "العلوم التقنية",
    "رياضة",
  ];
  const sectionMap = new Map<string, string>();

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
  console.timeEnd("sections");
  console.log(`Sections done: ${sectionNames.length}\n`);

  // ========================================
  // 4. SEED SPECIALITE
  // ========================================
  console.time("specialties");
  console.log("🎓 Seeding Specialite...");
  for (const spec of specialites) {
    try {
      await prisma.specialite.upsert({
        where: { codeOrientation: spec.codeOrientation },
        update: {
          nom: spec.nomSpecialite,
          etablissementId: spec.etablissementId || null,
          universiteId: spec.universiteId || null,
        },
        create: {
          codeOrientation: spec.codeOrientation,
          nom: spec.nomSpecialite,
          etablissementId: spec.etablissementId || null,
          universiteId: spec.universiteId || null,
        },
      });
      stats.specialite.processed++;
    } catch (error) {
      console.error(
        `  ❌ Failed for code ${spec.codeOrientation}:`,
        (error as any).message
      );
      stats.specialite.skipped++;
    }
  }
  console.timeEnd("specialties");
  console.log(`Specialties done: ${specialites.length}\n`);

  const allSpecialites = await prisma.specialite.findMany({
    select: { id: true, codeOrientation: true },
  });
  const specialiteMap = new Map<string, string>();
  for (const spec of allSpecialites) {
    specialiteMap.set(spec.codeOrientation, spec.id);
  }

  // ========================================
  // 5. SEED STATISTIQUE ADMISSION
  // ========================================
  console.time("scores");
  console.log("📊 Seeding StatistiqueAdmission...");
  const dedupedScores = deduplicateBy(
    scores,
    (s) => `${s.annee}-${s.codeOrientation}-${s.sectionBac}`
  );
  const seenStatistics = new Set<string>();

  for (const row of dedupedScores) {
    try {
      if (!row.codeOrientation || !row.sectionBac) {
        stats.statistiqueAdmission.unresolved++;
        continue;
      }

      const specialiteId = specialiteMap.get(row.codeOrientation);
      if (!specialiteId) {
        stats.statistiqueAdmission.unresolved++;
        continue;
      }

      const sectionId = sectionMap.get(normalizeLabel(row.sectionBac));
      if (!sectionId) {
        stats.statistiqueAdmission.unresolved++;
        continue;
      }

      const dupKey = `${row.annee}-${sectionId}-${specialiteId}`;
      if (seenStatistics.has(dupKey)) {
        stats.statistiqueAdmission.skipped++;
        continue;
      }

      await prisma.statistiqueAdmission.upsert({
        where: {
          annee_sectionId_specialiteId: {
            annee: row.annee,
            sectionId,
            specialiteId,
          },
        },
        update: {
          scoreDernierAdmis: row.scoreDernierAdmis,
        },
        create: {
          annee: row.annee,
          sectionId,
          specialiteId,
          scoreDernierAdmis: row.scoreDernierAdmis,
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
  console.timeEnd("scores");
  console.log(`Scores done: ${dedupedScores.length}\n`);

  // ========================================
  // 6. SEED CAPACITE ADMISSION
  // ========================================
  console.time("capacities");
  console.log("📈 Seeding CapaciteAdmission...");
  const dedupedCapacities = deduplicateBy(
    capacities,
    (c) => `${c.annee}-${c.tour}-${c.codeOrientation}-${c.sectionBac}`
  );
  const seenCapacities = new Set<string>();

  for (const row of dedupedCapacities) {
    try {
      if (!row.codeOrientation || !row.sectionBac || !row.tour) {
        stats.capaciteAdmission.unresolved++;
        continue;
      }

      const specialiteId = specialiteMap.get(row.codeOrientation);
      if (!specialiteId) {
        stats.capaciteAdmission.unresolved++;
        continue;
      }

      const sectionId = sectionMap.get(normalizeLabel(row.sectionBac));
      if (!sectionId) {
        stats.capaciteAdmission.unresolved++;
        continue;
      }

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
            sectionId,
            specialiteId,
          },
        },
        update: {
          capacite: row.capacite,
        },
        create: {
          annee: row.annee,
          tour: row.tour,
          sectionId,
          specialiteId,
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
  console.timeEnd("capacities");
  console.log(`Capacities done: ${dedupedCapacities.length}\n`);

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
    if ("unresolved" in counts && counts.unresolved && counts.unresolved > 0) {
      console.log(`  Unresolved: ${counts.unresolved.toString().padStart(4)}`);
    }
    console.log();
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ Seed completed successfully!");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("Seed finished.");
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
