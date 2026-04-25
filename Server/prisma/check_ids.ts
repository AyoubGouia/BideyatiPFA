
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const unis = await prisma.universite.findMany({ select: { id: true, nom: true } });
  console.log("Universities:", unis);
  
  const etabs = await prisma.etablissement.findMany({ select: { id: true, nom: true, code: true }, take: 10 });
  console.log("Sample Establishments:", etabs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
