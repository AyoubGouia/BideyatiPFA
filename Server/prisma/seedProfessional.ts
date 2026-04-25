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

const JSON_PATH = path.join(__dirname, "../data/prisma_seed_data.json");

async function main() {
  console.log("🚀 Starting Professional Data Reset & Seed...");

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`❌ JSON file not found at: ${JSON_PATH}`);
    return;
  }

  const rawData = fs.readFileSync(JSON_PATH, "utf-8");
  const data = JSON.parse(rawData);

  // ==========================================================================
  // 1. CLEANUP PHASE
  // ==========================================================================
  console.log("🧹 Cleaning up old academic data...");

  // Delete in order to respect foreign key constraints
  await prisma.statistiqueAdmission.deleteMany({});
  await prisma.capaciteAdmission.deleteMany({});
  await prisma.metierSpecialite.deleteMany({});
  await prisma.metier.deleteMany({});
  await prisma.favori.deleteMany({});
  await prisma.recommandation.deleteMany({});
  await prisma.specialite.deleteMany({});
  await prisma.etablissement.deleteMany({});
  await prisma.universite.deleteMany({});
  await prisma.sectionMatiere.deleteMany({});
  await prisma.matiere.deleteMany({});
  
  // Important: Reset user sections before deleting sections
  await prisma.user.updateMany({
    data: { sectionId: null },
  });
  await prisma.section.deleteMany({});

  console.log("✅ Database reset successful (except users).");

  // ==========================================================================
  // 2. SEEDING PHASE
  // ==========================================================================
  
  // 2.1 Sections
  console.log("📖 Seeding Sections...");
  for (const s of data.sections) {
    await prisma.section.create({ data: s });
  }

  // 2.2 Universities
  console.log("📚 Seeding Universites...");
  for (const u of data.universites) {
    await prisma.universite.create({ data: u });
  }

  // Create a fallback university for orphan establishments if needed
  const fallbackUniId = "standalone-institutions";
  await prisma.universite.upsert({
    where: { id: fallbackUniId },
    update: {},
    create: {
      id: fallbackUniId,
      nom: "Établissements Indépendants / Non-affiliés",
      ville: "Divers",
      region: "National",
      code: 999,
      description: "Regroupe les établissements qui ne sont pas rattachés à une université spécifique dans les données sources.",
    },
  });

  // 2.3 Establishments
  console.log("🏢 Seeding Etablissements...");
  for (const e of data.etablissements) {
    const finalEtabData = { ...e };
    if (!finalEtabData.universiteId) {
      finalEtabData.universiteId = fallbackUniId;
    }
    await prisma.etablissement.create({ data: finalEtabData });
  }

  // 2.4 Specialties
  console.log("🎓 Seeding Specialites...");
  for (const sp of data.specialites) {
    await prisma.specialite.create({ data: sp });
  }

  // 2.5 Admission Statistics
  console.log("📊 Seeding StatistiqueAdmission...");
  // Use chunks for statistics to avoid overloading if it's very large
  const stats = data.statistiquesAdmissions;
  for (let i = 0; i < stats.length; i += 100) {
    const chunk = stats.slice(i, i + 100);
    await Promise.all(
      chunk.map((s: any) => prisma.statistiqueAdmission.create({ data: s }))
    );
    if (i % 1000 === 0) console.log(`   Processed ${i}/${stats.length} stats...`);
  }

  // 2.6 Metiers
  console.log("💼 Seeding Metiers...");
  for (const m of data.metiers) {
    await prisma.metier.create({ data: m });
  }

  // 2.7 Metier-Specialty Links
  console.log("🔗 Seeding MetierSpecialite links...");
  for (const ms of data.metierSpecialites) {
    await prisma.metierSpecialite.create({ data: ms });
  }

  console.log("\n✨ Professional Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
