import rawData from './data_filieres.json'

export interface FiliereMetier {
  nom: string
  salaire_moyen: string
  competences: string[]
}

export interface FiliereDomaine {
  id: string
  nom: string
}

export interface FiliereDiplome {
  nom: string
  niveau: string
  type: string
}

export interface FiliereEnrichissement {
  code: string
  filiere: string
  domaine: FiliereDomaine
  diplome: FiliereDiplome
  tags: string[]
  metiers: FiliereMetier[]
  competences: string[]
  taux_admission: string
}

const filieres = (rawData as { filieres: FiliereEnrichissement[] }).filieres

// Primary index: code → filiere (O(1))
const codeIndex = new Map<string, FiliereEnrichissement>(
  filieres.map((f) => [f.code, f])
)

// Normalize a name for comparison
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, '')     // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

// Secondary index: normalized filiere name → filiere (O(1))
const nameIndex = new Map<string, FiliereEnrichissement>(
  filieres.map((f) => [normalize(f.filiere), f])
)

export function getFiliere(
  codeOrientation: string | null | undefined,
  specialiteName?: string | null
): FiliereEnrichissement | null {
  // 1. Exact code match (fastest, most reliable)
  if (codeOrientation) {
    const byCode = codeIndex.get(codeOrientation)
    if (byCode) return byCode
  }

  // 2. Exact normalized name match
  if (specialiteName) {
    const key = normalize(specialiteName)
    const byName = nameIndex.get(key)
    if (byName) return byName

    // 3. Partial word match — for demo data where codes don't align
    //    Score each JSON filiere by how many significant words overlap
    const words = key.split(' ').filter((w) => w.length > 3)
    if (words.length > 0) {
      let bestScore = 0
      let bestMatch: FiliereEnrichissement | null = null

      for (const [normName, filiere] of nameIndex) {
        const score = words.filter((w) => normName.includes(w)).length
        if (score > bestScore) {
          bestScore = score
          bestMatch = filiere
        }
      }

      // Accept match only if at least half the significant words matched
      if (bestMatch && bestScore >= Math.ceil(words.length / 2)) {
        return bestMatch
      }
    }
  }

  return null
}
