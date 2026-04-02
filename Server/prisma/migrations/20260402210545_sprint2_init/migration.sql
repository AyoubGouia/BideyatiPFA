/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Universite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Universite" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "code" INTEGER,
ADD COLUMN     "nomAr" TEXT,
ADD COLUMN     "siteweb" TEXT;

-- CreateTable
CREATE TABLE "Etablissement" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "nomAr" TEXT,
    "website" TEXT,
    "gouvernorat" TEXT,
    "type" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "universiteId" TEXT NOT NULL,

    CONSTRAINT "Etablissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Etablissement_code_key" ON "Etablissement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Universite_code_key" ON "Universite"("code");

-- AddForeignKey
ALTER TABLE "Etablissement" ADD CONSTRAINT "Etablissement_universiteId_fkey" FOREIGN KEY ("universiteId") REFERENCES "Universite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
