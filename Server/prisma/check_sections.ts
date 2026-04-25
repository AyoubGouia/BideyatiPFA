
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
  const sections = await prisma.section.findMany();
  console.log("Sections:", sections);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
