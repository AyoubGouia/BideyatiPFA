import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL for seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const maths = await prisma.matiere.upsert({
    where: { id: "matiere-maths" },
    update: { nom: "Mathematiques" },
    create: { id: "matiere-maths", nom: "Mathematiques" },
  });

  const physique = await prisma.matiere.upsert({
    where: { id: "matiere-physique" },
    update: { nom: "Physique" },
    create: { id: "matiere-physique", nom: "Physique" },
  });

  await prisma.universite.upsert({
    where: { id: "univ-alger" },
    update: {
      nom: "Universite d'Alger",
      ville: "Alger",
      region: "Algerie",
      description: "Universite publique pour orientation etudes superieures.",
    },
    create: {
      id: "univ-alger",
      nom: "Universite d'Alger",
      ville: "Alger",
      region: "Algerie",
      description: "Universite publique pour orientation etudes superieures.",
    },
  });

  await prisma.universite.upsert({
    where: { id: "univ-tunis" },
    update: {
      nom: "Universite de Tunis",
      ville: "Tunis",
      region: "Tunisie",
      description: "Universite publique en Tunisie.",
    },
    create: {
      id: "univ-tunis",
      nom: "Universite de Tunis",
      ville: "Tunis",
      region: "Tunisie",
      description: "Universite publique en Tunisie.",
    },
  });

  console.log("Seed done:", { matieres: [maths.id, physique.id] });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

