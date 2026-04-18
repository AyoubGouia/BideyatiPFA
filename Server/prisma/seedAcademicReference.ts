import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import { normalizeAcademicLabel } from "../src/application/utils/academicSubjectReference";

// SAFETY NOTE:
// This seed script is intentionally scoped for the Step 2 academic reference
// rollout on a single shared database. It must remain non-destructive and must
// not reseed or update the existing core university, establishment, admission,
// capacity, user, or questionnaire data.
//
// Allowed default write scope:
// - Matiere
// - SectionMatiere
//
// Optional opt-in write scope:
// - Specialite.formuleBrute only when ALLOW_SPECIALITE_FORMULA_WRITES=true
//
// Everything else is read-only in this script.

type AcademicSubjectReference = {
  version: string;
  validationStatus: string;
  subjects: Array<{
    id: string;
    code: string;
    nom: string;
    nomFr?: string;
    nomAr?: string | null;
    normalizedKey: string;
    aliases?: string[];
  }>;
};

type AcademicSectionSubjectReference = {
  version: string;
  validationStatus: string;
  sections: Array<{
    frontendKey: string;
    dbName: string;
    validationStatus: string;
    subjects: Array<{
      subjectId: string;
      coefficient: number | null;
      validationStatus: string;
    }>;
  }>;
};

type AcademicFormulaApprovalsReference = {
  version: string;
  validationStatus: string;
  approvedCodes: string[];
};

type AcademicFormulaTokensReference = {
  version: string;
  validationStatus: string;
  tokens: Array<{
    token: string;
    status: string;
    note?: string;
  }>;
};

type FormulaDraftRow = {
  codeOrientation: string;
  formuleBrute: string;
};

type UpsertStats = {
  inserted: number;
  updated: number;
  skipped: number;
  unresolved: number;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const REFERENCE_DIR = path.join(__dirname, "../data/reference");
const NORMALIZED_2025_DIR = path.join(__dirname, "../data/normalized/2025");

const WRITE_FORMULAS =
  (process.env.ALLOW_SPECIALITE_FORMULA_WRITES || "").toLowerCase() === "true";

function readJsonObject<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(content) as T;
}

function normalizeSectionLabel(label: string): string {
  if (!label) return "";
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[()]/g, "")
    .replace(/[,؛:/](?!\s)/g, "")
    .trim();
}

function deduplicateBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function seedMatieres(reference: AcademicSubjectReference): Promise<UpsertStats> {
  const stats: UpsertStats = { inserted: 0, updated: 0, skipped: 0, unresolved: 0 };
  const seenSubjectIds = new Set<string>();
  const seenNormalizedKeys = new Set<string>();

  for (const subject of reference.subjects ?? []) {
    if (!subject.id || !subject.nom || !subject.normalizedKey) {
      stats.unresolved++;
      continue;
    }

    const normalizedKey = normalizeAcademicLabel(subject.normalizedKey);
    if (!normalizedKey || seenSubjectIds.has(subject.id) || seenNormalizedKeys.has(normalizedKey)) {
      stats.skipped++;
      continue;
    }

    const existing = await prisma.matiere.findUnique({
      where: { id: subject.id },
      select: { id: true, nom: true },
    });

    if (!existing) {
      await prisma.matiere.create({
        data: {
          id: subject.id,
          nom: subject.nom,
        },
      });
      stats.inserted++;
    } else if (existing.nom !== subject.nom) {
      await prisma.matiere.update({
        where: { id: subject.id },
        data: { nom: subject.nom },
      });
      stats.updated++;
    } else {
      stats.skipped++;
    }

    seenSubjectIds.add(subject.id);
    seenNormalizedKeys.add(normalizedKey);
  }

  return stats;
}

async function seedSectionMatieres(
  reference: AcademicSectionSubjectReference
): Promise<UpsertStats> {
  const stats: UpsertStats = { inserted: 0, updated: 0, skipped: 0, unresolved: 0 };

  const sections = await prisma.section.findMany({
    select: { id: true, nom: true },
  });
  const sectionMap = new Map(
    sections.map((section) => [normalizeSectionLabel(section.nom), section.id])
  );

  for (const sectionReference of reference.sections ?? []) {
    const sectionId = sectionMap.get(normalizeSectionLabel(sectionReference.dbName || ""));
    if (!sectionId) {
      stats.unresolved += Array.isArray(sectionReference.subjects)
        ? sectionReference.subjects.length
        : 0;
      continue;
    }

    for (const subjectEntry of sectionReference.subjects ?? []) {
      if (!subjectEntry.subjectId) {
        stats.unresolved++;
        continue;
      }

      const coefficient =
        typeof subjectEntry.coefficient === "number" ? subjectEntry.coefficient : null;
      const approved = subjectEntry.validationStatus === "approved";

      if (!approved || coefficient === null) {
        stats.unresolved++;
        continue;
      }

      const matiere = await prisma.matiere.findUnique({
        where: { id: subjectEntry.subjectId },
        select: { id: true },
      });
      if (!matiere) {
        stats.unresolved++;
        continue;
      }

      const existing = await prisma.sectionMatiere.findUnique({
        where: {
          sectionId_matiereId: {
            sectionId,
            matiereId: subjectEntry.subjectId,
          },
        },
        select: { coefficient: true },
      });

      if (!existing) {
        await prisma.sectionMatiere.create({
          data: {
            sectionId,
            matiereId: subjectEntry.subjectId,
            coefficient,
          },
        });
        stats.inserted++;
      } else if (existing.coefficient !== coefficient) {
        await prisma.sectionMatiere.update({
          where: {
            sectionId_matiereId: {
              sectionId,
              matiereId: subjectEntry.subjectId,
            },
          },
          data: { coefficient },
        });
        stats.updated++;
      } else {
        stats.skipped++;
      }
    }
  }

  return stats;
}

async function maybeSeedFormulesBrutes(
  approvals: AcademicFormulaApprovalsReference,
  formulaDrafts: FormulaDraftRow[]
): Promise<UpsertStats> {
  const stats: UpsertStats = { inserted: 0, updated: 0, skipped: 0, unresolved: 0 };

  if (!WRITE_FORMULAS) {
    stats.skipped = formulaDrafts.length;
    return stats;
  }

  const approvedCodes = new Set(Array.isArray(approvals.approvedCodes) ? approvals.approvedCodes : []);
  const dedupedDrafts = deduplicateBy(
    formulaDrafts.filter(
      (draft) =>
        typeof draft?.codeOrientation === "string" && typeof draft?.formuleBrute === "string"
    ),
    (draft) => draft.codeOrientation
  );

  for (const draft of dedupedDrafts) {
    if (!approvedCodes.has(draft.codeOrientation)) {
      stats.unresolved++;
      continue;
    }

    const specialite = await prisma.specialite.findUnique({
      where: { codeOrientation: draft.codeOrientation },
      select: { id: true, formuleBrute: true },
    });

    if (!specialite) {
      stats.unresolved++;
      continue;
    }

    if (specialite.formuleBrute === draft.formuleBrute) {
      stats.skipped++;
      continue;
    }

    await prisma.specialite.update({
      where: { id: specialite.id },
      data: { formuleBrute: draft.formuleBrute },
    });
    stats.updated++;
  }

  return stats;
}

async function main() {
  console.log("\nAcademic reference seed started.");
  console.log("Scope: Step 2 normalization only.");
  console.log("Default write scope: Matiere, SectionMatiere.");
  console.log(
    `Formula writes: ${WRITE_FORMULAS ? "ENABLED (explicit opt-in)" : "SKIPPED by default for safety"}`
  );

  const subjectsReferencePath = path.join(
    REFERENCE_DIR,
    "academic-subjects.reference.json"
  );
  const sectionSubjectsReferencePath = path.join(
    REFERENCE_DIR,
    "academic-section-subjects.reference.json"
  );
  const formulaApprovalsPath = path.join(
    REFERENCE_DIR,
    "academic-formula-approvals.reference.json"
  );
  const formulaTokensPath = path.join(
    REFERENCE_DIR,
    "academic-formula-tokens.reference.json"
  );
  const normalizedFormulaDraftPath = path.join(
    NORMALIZED_2025_DIR,
    "specialties_base.cleaned.sample.json"
  );

  const subjectsReference = readJsonObject<AcademicSubjectReference>(subjectsReferencePath);
  const sectionSubjectsReference = readJsonObject<AcademicSectionSubjectReference>(
    sectionSubjectsReferencePath
  );
  const formulaApprovals =
    readJsonObject<AcademicFormulaApprovalsReference>(formulaApprovalsPath);
  const formulaTokens = readJsonObject<AcademicFormulaTokensReference>(formulaTokensPath);
  const normalizedFormulaDrafts = readJsonObject<FormulaDraftRow[]>(
    normalizedFormulaDraftPath
  );

  console.log("Reference files:");
  console.log(`  ${subjectsReferencePath}`);
  console.log(`  ${sectionSubjectsReferencePath}`);
  console.log(`  ${formulaApprovalsPath}`);
  console.log(`  ${formulaTokensPath}`);
  console.log(`  ${normalizedFormulaDraftPath}`);

  const matiereStats = await seedMatieres(subjectsReference);
  const sectionMatiereStats = await seedSectionMatieres(sectionSubjectsReference);
  const formuleStats = await maybeSeedFormulesBrutes(
    formulaApprovals,
    normalizedFormulaDrafts
  );

  const tokenSummary = (formulaTokens.tokens ?? []).reduce(
    (acc: Record<string, number>, token) => {
      acc[token.status] = (acc[token.status] || 0) + 1;
      return acc;
    },
    {}
  );

  console.log("\nAcademic reference seed summary:");
  console.log(
    `  Matiere -> inserted: ${matiereStats.inserted}, updated: ${matiereStats.updated}, skipped: ${matiereStats.skipped}, unresolved: ${matiereStats.unresolved}`
  );
  console.log(
    `  SectionMatiere -> inserted: ${sectionMatiereStats.inserted}, updated: ${sectionMatiereStats.updated}, skipped: ${sectionMatiereStats.skipped}, unresolved: ${sectionMatiereStats.unresolved}`
  );
  console.log(
    `  formuleBrute -> inserted: ${formuleStats.inserted}, updated: ${formuleStats.updated}, skipped: ${formuleStats.skipped}, unresolved: ${formuleStats.unresolved}`
  );
  console.log(
    `  Formula writes default: ${WRITE_FORMULAS ? "explicitly enabled" : "skipped for safety"}`
  );
  console.log(`  Formula token coverage: ${JSON.stringify(tokenSummary)}`);
  console.log(
    "  No other tables were touched: Universite, Etablissement, Section identity, StatistiqueAdmission, CapaciteAdmission, User, StudentProfile, Questionnaire, NoteEtudiant."
  );
}

main()
  .catch((error) => {
    console.error("\nAcademic reference seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
