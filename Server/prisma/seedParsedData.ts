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

async function main() {
  console.log("🚀 Starting seed from parsed JSON data...");

  const dataPath = path.join(__dirname, "../../Client/src/data/prisma_seed_data (2).json");
  if (!fs.existsSync(dataPath)) {
    throw new Error(`File not found: ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, "utf-8");
  const data = JSON.parse(rawData);

  console.log(`📦 Loaded data from JSON.`);

  // 1. Sections
  if (data.sections) {
    console.log(`Seeding ${data.sections.length} Sections...`);
    for (const item of data.sections) {
      await prisma.section.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
  }

  // 2. Universites
  if (data.universites) {
    console.log(`Seeding ${data.universites.length} Universites...`);
    for (const item of data.universites) {
      await prisma.universite.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
  }

  // Ensure an Unknown University exists for Etablissements with null universiteId
  const UNKNOWN_UNI_ID = "unknown-university-id";
  await prisma.universite.upsert({
    where: { id: UNKNOWN_UNI_ID },
    update: {},
    create: {
      id: UNKNOWN_UNI_ID,
      nom: "Université Inconnue",
      ville: "Inconnue",
      region: "Inconnue",
    },
  });

  // 3. Etablissements
  if (data.etablissements) {
    console.log(`Seeding ${data.etablissements.length} Etablissements...`);
    for (const item of data.etablissements) {
      if (!item.universiteId) {
        item.universiteId = UNKNOWN_UNI_ID;
      }
      
      // Upsert by code since it's @unique and more stable for upserts if ID changes,
      // but ID is primary key. Let's try ID first, if the JSON has stable IDs.
      await prisma.etablissement.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
  }

  // 4. Specialites
  if (data.specialites) {
    console.log(`Seeding ${data.specialites.length} Specialites...`);
    for (const item of data.specialites) {
      await prisma.specialite.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
  }

  // 5. Metiers
  if (data.metiers) {
    console.log(`Seeding ${data.metiers.length} Metiers...`);
    for (const item of data.metiers) {
      await prisma.metier.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
  }

  // 6. MetierSpecialites
  if (data.metierSpecialites) {
    console.log(`Seeding ${data.metierSpecialites.length} MetierSpecialites...`);
    for (const item of data.metierSpecialites) {
      await prisma.metierSpecialite.upsert({
        where: {
          metierId_specialiteId: {
            metierId: item.metierId,
            specialiteId: item.specialiteId,
          },
        },
        update: item,
        create: item,
      });
    }
  }

  // 7. StatistiqueAdmission
  if (data.statistiquesAdmissions) {
    console.log(`Seeding ${data.statistiquesAdmissions.length} StatistiqueAdmissions...`);
    for (const item of data.statistiquesAdmissions) {
      // Upsert using the unique constraint composite key to prevent duplicates
      const { id, ...rest } = item;
      
      if (!item.sectionId) {
        // Fallback to id if sectionId is somehow missing
        await prisma.statistiqueAdmission.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
        continue;
      }
      
      await prisma.statistiqueAdmission.upsert({
        where: {
          annee_sectionId_specialiteId: {
            annee: item.annee,
            sectionId: item.sectionId,
            specialiteId: item.specialiteId,
          },
        },
        update: item,
        create: item,
      });
    }
  }

  // 8. CapaciteAdmission
  if (data.capacitesAdmissions) {
    console.log(`Seeding ${data.capacitesAdmissions.length} CapaciteAdmissions...`);
    for (const item of data.capacitesAdmissions) {
      const { id, ...rest } = item;
      
      if (!item.sectionId || !item.tour) {
        // Fallback to id if missing composite keys
        await prisma.capaciteAdmission.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
        continue;
      }
      
      await prisma.capaciteAdmission.upsert({
        where: {
          annee_tour_sectionId_specialiteId: {
            annee: item.annee,
            tour: item.tour,
            sectionId: item.sectionId,
            specialiteId: item.specialiteId,
          },
        },
        update: item,
        create: item,
      });
    }
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
