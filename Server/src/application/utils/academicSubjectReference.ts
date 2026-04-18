import * as fs from "fs";
import * as path from "path";

type AcademicSubject = {
  id: string;
  code: string;
  nom: string;
  nomFr: string;
  nomAr: string | null;
  normalizedKey: string;
  aliases?: string[];
};

type AcademicSubjectsReference = {
  version: string;
  validationStatus: string;
  subjects: AcademicSubject[];
};

let cachedReference: AcademicSubjectsReference | null = null;
let cachedSubjectMap: Map<string, string> | null = null;

const SUBJECT_REFERENCE_CANDIDATE_PATHS = [
  path.resolve(process.cwd(), "data/reference/academic-subjects.reference.json"),
  path.resolve(process.cwd(), "Server/data/reference/academic-subjects.reference.json"),
];

function resolveReferencePath(): string {
  const found = SUBJECT_REFERENCE_CANDIDATE_PATHS.find((candidate) =>
    fs.existsSync(candidate)
  );

  if (!found) {
    throw new Error(
      `Academic subject reference not found. Checked: ${SUBJECT_REFERENCE_CANDIDATE_PATHS.join(
        ", "
      )}`
    );
  }

  return found;
}

function applyEncodingFixups(value: string): string {
  return value
    .replace(/Ã©/g, "e")
    .replace(/Ã¨/g, "e")
    .replace(/Ãª/g, "e")
    .replace(/Ã«/g, "e")
    .replace(/Ã‰/g, "E")
    .replace(/Ã /g, "a")
    .replace(/Ã¢/g, "a")
    .replace(/Ã§/g, "c")
    .replace(/Ã¹/g, "u")
    .replace(/Ã»/g, "u")
    .replace(/Ã´/g, "o")
    .replace(/â€™/g, "'")
    .replace(/â€“/g, "-")
    .replace(/Â/g, "");
}

export function normalizeAcademicLabel(value: string): string {
  return applyEncodingFixups(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function loadAcademicSubjectsReference(): AcademicSubjectsReference {
  if (cachedReference) return cachedReference;

  const filePath = resolveReferencePath();
  const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  cachedReference = JSON.parse(content) as AcademicSubjectsReference;
  return cachedReference;
}

function buildSubjectAliasMap(): Map<string, string> {
  if (cachedSubjectMap) return cachedSubjectMap;

  const reference = loadAcademicSubjectsReference();
  const subjectMap = new Map<string, string>();

  for (const subject of reference.subjects) {
    const candidates = [
      subject.normalizedKey,
      subject.code,
      subject.nom,
      subject.nomFr,
      ...(subject.aliases ?? []),
    ];

    for (const candidate of candidates) {
      const normalizedCandidate = normalizeAcademicLabel(candidate);
      if (!normalizedCandidate) continue;
      if (!subjectMap.has(normalizedCandidate)) {
        subjectMap.set(normalizedCandidate, subject.id);
      }
    }
  }

  cachedSubjectMap = subjectMap;
  return subjectMap;
}

export function resolveCanonicalMatiereId(rawSubjectLabel: string): string | null {
  const normalizedLabel = normalizeAcademicLabel(rawSubjectLabel);
  if (!normalizedLabel) return null;

  const subjectMap = buildSubjectAliasMap();
  return subjectMap.get(normalizedLabel) ?? null;
}
