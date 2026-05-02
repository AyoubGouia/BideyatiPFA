import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from 'dotenv';
dotenv.config();

const datasourceUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: datasourceUrl }),
});

async function main() {
  const count = await prisma.metier.count();
  console.log('Metiers count:', count);
  
  if (count > 0) {
    const sample = await prisma.metier.findFirst({ include: { specialites: true } });
    console.log('Sample:', JSON.stringify(sample, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
