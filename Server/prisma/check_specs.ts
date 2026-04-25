
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
  const specs = await prisma.specialite.findMany({ 
    select: { id: true, codeOrientation: true, nom: true },
    take: 10 
  });
  console.log("Specialties:", specs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
