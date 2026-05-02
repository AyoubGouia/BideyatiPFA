import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from 'dotenv';
dotenv.config();

const datasourceUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: datasourceUrl }),
});

async function main() {
  const metier = await prisma.metier.findFirst({
    where: { id: '24044f12-87b8-4fc3-817c-17c88398694c' }
  });
  console.log('Metier:', JSON.stringify(metier, null, 2));
}

main().finally(() => prisma.$disconnect());
