
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
  console.log("🔄 Merging duplicate sections...");

  const mapping = {
    "رياضيات": "Mathématiques",
    "علوم تجريبية": "Sciences Expérimentales",
    "علوم الإعلامية": "Sciences Informatiques",
    "العلوم التقنية": "Sciences Techniques",
    "آداب": "Lettres",
    "إقتصاد وتصرف": "Economie et Gestion",
    "رياضة": "Sport"
  };

  for (const [oldNom, newNom] of Object.entries(mapping)) {
    const oldSection = await prisma.section.findUnique({ where: { nom: oldNom } });
    const newSection = await prisma.section.findUnique({ where: { nom: newNom } });

    if (oldSection && newSection) {
      console.log(`🔗 Moving users from ${oldNom} to ${newNom}...`);
      await prisma.user.updateMany({
        where: { sectionId: oldSection.id },
        data: { sectionId: newSection.id }
      });
      
      // Also move stats if any were accidentally linked to the old section
      await prisma.statistiqueAdmission.updateMany({
        where: { sectionId: oldSection.id },
        data: { sectionId: newSection.id }
      });

      await prisma.capaciteAdmission.updateMany({
        where: { sectionId: oldSection.id },
        data: { sectionId: newSection.id }
      });

      console.log(`🗑️ Deleting old section ${oldNom}...`);
      await prisma.section.delete({ where: { id: oldSection.id } });
    }
  }

  console.log("✅ Sections unified successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
