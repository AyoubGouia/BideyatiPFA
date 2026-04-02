/**
 * seedEtablissements.ts
 * Seeds the Etablissement table from data/normalized/etablissements.json
 * Run AFTER seedUniversites.ts (foreign key dependency)
 *
 * Run: npx tsx prisma/seed/seedEtablissements.ts
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Missing DATABASE_URL");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

interface NormalizedEtablissement {
  id: string;
  code: number;
  nom: string;
  nomAr: string | null;
  website: string | null;
  gouvernorat: string | null;
  type: string | null;
  lat: number | null;
  lon: number | null;
  universiteId: string;
}

async function main() {
  const filePath = path.resolve(__dirname, "../../data/normalized/etablissements.json");
  const data: NormalizedEtablissement[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let upserted = 0;
  for (const e of data) {
    await prisma.etablissement.upsert({
      where: { id: e.id },
      update: {
        code: e.code,
        nom: e.nom,
        nomAr: e.nomAr,
        website: e.website,
        gouvernorat: e.gouvernorat,
        type: e.type,
        lat: e.lat,
        lon: e.lon,
        universiteId: e.universiteId,
      },
      create: {
        id: e.id,
        code: e.code,
        nom: e.nom,
        nomAr: e.nomAr,
        website: e.website,
        gouvernorat: e.gouvernorat,
        type: e.type,
        lat: e.lat,
        lon: e.lon,
        universiteId: e.universiteId,
      },
    });
    upserted++;
  }

  console.log(`✅ Seeded ${upserted} etablissements`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
