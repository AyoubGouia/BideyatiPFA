/**
 * seedUniversites.ts
 * Seeds the Universite table from data/normalized/universites.json
 *
 * Run: npx tsx prisma/seed/seedUniversites.ts
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

interface NormalizedUniversite {
  id: string;
  code: number;
  nom: string;
  nomAr: string | null;
  siteweb: string | null;
  adresse: string | null;
  ville: string;
  region: string;
  description: string | null;
}

async function main() {
  const filePath = path.resolve(__dirname, "../../data/normalized/universites.json");
  const data: NormalizedUniversite[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let upserted = 0;
  for (const u of data) {
    await prisma.universite.upsert({
      where: { id: u.id },
      update: {
        nom: u.nom,
        nomAr: u.nomAr,
        siteweb: u.siteweb,
        adresse: u.adresse,
        ville: u.ville,
        region: u.region,
        description: u.description,
        code: u.code,
      },
      create: {
        id: u.id,
        code: u.code,
        nom: u.nom,
        nomAr: u.nomAr,
        siteweb: u.siteweb,
        adresse: u.adresse,
        ville: u.ville,
        region: u.region,
        description: u.description,
      },
    });
    upserted++;
  }

  console.log(`✅ Seeded ${upserted} universities`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
