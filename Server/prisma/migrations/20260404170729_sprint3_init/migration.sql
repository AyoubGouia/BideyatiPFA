/*
  Warnings:

  - A unique constraint covering the columns `[nom]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codeOrientation]` on the table `Specialite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[annee,sectionId,specialiteId]` on the table `StatistiqueAdmission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codeOrientation` to the `Specialite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scoreDernierAdmis` to the `StatistiqueAdmission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Specialite" DROP CONSTRAINT "Specialite_universiteId_fkey";

-- AlterTable
ALTER TABLE "Specialite" ADD COLUMN     "codeOrientation" TEXT NOT NULL,
ADD COLUMN     "etablissementId" TEXT,
ADD COLUMN     "formuleBrute" TEXT,
ALTER COLUMN "domaine" DROP NOT NULL,
ALTER COLUMN "scoreMinimum" DROP NOT NULL,
ALTER COLUMN "universiteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StatistiqueAdmission" ADD COLUMN     "scoreDernierAdmis" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sectionId" TEXT,
ALTER COLUMN "scoreMinimum" DROP NOT NULL,
ALTER COLUMN "tauxAdmission" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CapaciteAdmission" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "tour" TEXT NOT NULL,
    "sectionId" TEXT,
    "capacite" INTEGER NOT NULL,
    "specialiteId" TEXT NOT NULL,

    CONSTRAINT "CapaciteAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CapaciteAdmission_annee_tour_sectionId_specialiteId_key" ON "CapaciteAdmission"("annee", "tour", "sectionId", "specialiteId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_nom_key" ON "Section"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Specialite_codeOrientation_key" ON "Specialite"("codeOrientation");

-- CreateIndex
CREATE UNIQUE INDEX "StatistiqueAdmission_annee_sectionId_specialiteId_key" ON "StatistiqueAdmission"("annee", "sectionId", "specialiteId");

-- AddForeignKey
ALTER TABLE "Specialite" ADD CONSTRAINT "Specialite_universiteId_fkey" FOREIGN KEY ("universiteId") REFERENCES "Universite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialite" ADD CONSTRAINT "Specialite_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatistiqueAdmission" ADD CONSTRAINT "StatistiqueAdmission_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapaciteAdmission" ADD CONSTRAINT "CapaciteAdmission_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapaciteAdmission" ADD CONSTRAINT "CapaciteAdmission_specialiteId_fkey" FOREIGN KEY ("specialiteId") REFERENCES "Specialite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
