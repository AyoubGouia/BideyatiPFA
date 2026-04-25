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

const JSON_PATH = path.join(__dirname, "../../Client/src/data/data_orientation_expert.json");

const SECTION_MAP: Record<string, string> = {
  "Sciences Expérimentales": "علوم تجريبية",
  "Economie et Gestion": "إقتصاد وتصرف",
  "Lettres": "آداب",
  "Mathématiques": "رياضيات",
  "Sciences Informatiques": "علوم الإعلامية",
  "Sciences Techniques": "العلوم التقنية",
  "Sport": "رياضة",
};

function slugify(text: string): string {
  if (!text) return "UNKNOWN";
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  console.log("🚀 Starting Expert Data Seed...");
  
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`❌ JSON file not found at: ${JSON_PATH}`);
    return;
  }

  const rawData = fs.readFileSync(JSON_PATH, "utf-8");
  const data = JSON.parse(rawData);
  console.log(`📦 Loaded ${data.length} records from JSON.`);

  // Prefetch existing sections to map by name
  const existingSections = await prisma.section.findMany();
  const sectionIdMap = new Map<string, string>();
  existingSections.forEach(s => sectionIdMap.set(s.nom, s.id));

  let count = 0;
  for (const item of data) {
    count++;
    if (count % 10 === 0 || count === 1) {
      console.log(`🔄 Processed ${count}/${data.length} records...`);
    }

    try {
      const uniId = slugify(item.universite);
      const etabId = slugify(item.etablissement);

      // 1. Upsert University
      await prisma.universite.upsert({
        where: { id: uniId },
        update: {
          nom: item.universite,
          region: item.universite_info?.region || "Inconnu",
          ville: item.universite_info?.region || "Inconnu",
        },
        create: {
          id: uniId,
          nom: item.universite,
          region: item.universite_info?.region || "Inconnu",
          ville: item.universite_info?.region || "Inconnu",
        },
      });

      // 2. Upsert Establishment
      const etabCode = parseInt(item.code.substring(0, 3));
      let existingEtab = null;
      if (!isNaN(etabCode)) {
        existingEtab = await prisma.etablissement.findUnique({ where: { code: etabCode } });
        
        await prisma.etablissement.upsert({
          where: { id: existingEtab ? existingEtab.id : etabId },
          update: {
            nom: item.etablissement,
            universiteId: uniId,
            gouvernorat: item.localisation?.region || null,
          },
          create: {
            id: etabId,
            code: etabCode,
            nom: item.etablissement,
            universiteId: uniId,
            gouvernorat: item.localisation?.region || null,
          },
        });
      } else {
        console.warn(`⚠️ Invalid establishment code for ${item.code}, skipping establishment upsert.`);
      }

      // 3. Upsert Specialty (Specialite)
      const targetEtabId = existingEtab ? existingEtab.id : etabId;
      const specialite = await prisma.specialite.upsert({
        where: { codeOrientation: item.code },
        update: {
          nom: item.filiere,
          universiteId: uniId,
          etablissementId: targetEtabId,
          domaine: item.domaine?.nom || null,
        },
        create: {
          codeOrientation: item.code,
          nom: item.filiere,
          universiteId: uniId,
          etablissementId: targetEtabId,
          domaine: item.domaine?.nom || null,
        },
      });

      // 4. Seeding Admission Statistics
      if (item.scores_par_specialite) {
        for (const [sectionLabel, years] of Object.entries(item.scores_par_specialite)) {
          const arabicSectionName = SECTION_MAP[sectionLabel];
          if (!arabicSectionName) continue;

          let sectionId = sectionIdMap.get(arabicSectionName);
          if (!sectionId) {
            const newSection = await prisma.section.create({ data: { nom: arabicSectionName } });
            sectionId = newSection.id;
            sectionIdMap.set(arabicSectionName, sectionId);
          }

          for (const [year, score] of Object.entries(years as any)) {
            if (score === null || score === undefined) continue;
            const numScore = parseFloat(score as string);
            if (isNaN(numScore)) continue;

            await prisma.statistiqueAdmission.upsert({
              where: {
                annee_sectionId_specialiteId: {
                  annee: parseInt(year),
                  sectionId: sectionId,
                  specialiteId: specialite.id,
                },
              },
              update: { scoreDernierAdmis: numScore },
              create: {
                annee: parseInt(year),
                sectionId: sectionId,
                specialiteId: specialite.id,
                scoreDernierAdmis: numScore,
              },
            });
          }
        }
      }

      // 5. Seeding Metiers
      if (item.metiers) {
        for (const mData of item.metiers) {
          const metierId = slugify(mData.nom);
          
          const metier = await prisma.metier.upsert({
            where: { id: metierId },
            update: {
              titre: mData.nom,
              secteur: item.domaine?.nom || "Général",
              tags: mData.competences || [],
            },
            create: {
              id: metierId,
              titre: mData.nom,
              secteur: item.domaine?.nom || "Général",
              tags: mData.competences || [],
            },
          });

          // Link Metier to Specialite
          await prisma.metierSpecialite.upsert({
            where: {
              metierId_specialiteId: {
                metierId: metierId,
                specialiteId: specialite.id,
              },
            },
            update: {},
            create: {
              metierId: metierId,
              specialiteId: specialite.id,
            },
          });
        }
      }
    } catch (error) {
      console.error(`❌ Failed to process record ${item.code} (${item.filiere}):`, error);
    }
  }

  console.log("✅ Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
