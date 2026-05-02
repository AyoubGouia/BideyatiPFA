import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from 'dotenv';
dotenv.config();

const datasourceUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: datasourceUrl }),
});

async function main() {
  const questionnaires = await prisma.questionnaire.findMany({
    include: { reponses: true }
  });
  console.log('Questionnaires:', JSON.stringify(questionnaires, null, 2));
}

main().finally(() => prisma.$disconnect());
