import type { Etablissement } from '../api/etablissementApi'
import type { SpecialiteListItem } from '../api/specialiteApi'
import { mapEtablissementToFaculty, type Faculty } from '../data/faculties'

export const DOMAIN_AUTRES = 'Autres'

export interface SpecialityBrowseEntry {
  id: string
  name: string
  domaine?: string | null
  faculties: Faculty[]
  specialiteIds: string[]
  codeOrientations: string[]
}

/** Primary domain = most frequent non-empty `domaine` on linked specialties; tie-break FR locale. */
export function primaryDomainFromSpecialites(
  specs: Pick<SpecialiteListItem, 'domaine'>[],
  etablissementType?: string | null
): string {
  const domains = specs
    .map(s => (s.domaine && s.domaine.trim()) || '')
    .filter(Boolean)
  if (domains.length === 0) {
    const t = etablissementType?.trim()
    return t || DOMAIN_AUTRES
  }
  const counts = new Map<string, number>()
  for (const d of domains) {
    counts.set(d, (counts.get(d) || 0) + 1)
  }
  let best = domains[0]
  let bestN = -1
  for (const [d, c] of counts) {
    if (c > bestN || (c === bestN && d.localeCompare(best, 'fr') < 0)) {
      best = d
      bestN = c
    }
  }
  return best
}

function addSpecToEtab(
  byEtab: Map<string, SpecialiteListItem[]>,
  etabId: string,
  s: SpecialiteListItem
) {
  if (!byEtab.has(etabId)) byEtab.set(etabId, [])
  const list = byEtab.get(etabId)!
  if (list.some(x => x.id === s.id)) return
  list.push(s)
}

export function mergeEtablissementsWithSpecialites(
  etabs: Etablissement[],
  specs: SpecialiteListItem[]
): Faculty[] {
  const byEtab = new Map<string, SpecialiteListItem[]>()
  for (const s of specs) {
    const eid = s.etablissement?.id
    if (eid) addSpecToEtab(byEtab, eid, s)
  }
  for (const s of specs) {
    if (s.etablissement?.id) continue
    const uid = s.universite?.id
    if (!uid) continue
    for (const e of etabs) {
      if (e.universiteId === uid) addSpecToEtab(byEtab, e.id, s)
    }
  }

  return etabs.map(e => {
    const list = [...(byEtab.get(e.id) || [])].sort((a, b) =>
      a.nom.localeCompare(b.nom, 'fr')
    )
    const base = mapEtablissementToFaculty(e)
    const programs = list.map(s => s.nom)
    const cat = primaryDomainFromSpecialites(list, e.type)
    return { ...base, programs, cat }
  })
}

export function groupEtablissementsBySpecialiteDomain(
  etabs: Etablissement[],
  specs: SpecialiteListItem[]
): Map<string, Faculty[]> {
  const etabById = new Map(etabs.map((etab) => [etab.id, etab]))
  const etabIdsByUniversite = new Map<string, string[]>()

  for (const etab of etabs) {
    if (!etabIdsByUniversite.has(etab.universiteId)) {
      etabIdsByUniversite.set(etab.universiteId, [])
    }
    etabIdsByUniversite.get(etab.universiteId)!.push(etab.id)
  }

  const domainToSpecsByEtab = new Map<string, Map<string, SpecialiteListItem[]>>()

  const addSpec = (domain: string, etabId: string, spec: SpecialiteListItem) => {
    if (!domainToSpecsByEtab.has(domain)) {
      domainToSpecsByEtab.set(domain, new Map<string, SpecialiteListItem[]>())
    }
    const etabsForDomain = domainToSpecsByEtab.get(domain)!
    if (!etabsForDomain.has(etabId)) {
      etabsForDomain.set(etabId, [])
    }
    const list = etabsForDomain.get(etabId)!
    if (list.some((item) => item.id === spec.id)) return
    list.push(spec)
  }

  for (const spec of specs) {
    const domain = spec.domaine?.trim() || DOMAIN_AUTRES
    if (spec.etablissement?.id) {
      addSpec(domain, spec.etablissement.id, spec)
      continue
    }

    const universiteId = spec.universite?.id
    if (!universiteId) continue

    const etabIds = etabIdsByUniversite.get(universiteId) || []
    for (const etabId of etabIds) {
      addSpec(domain, etabId, spec)
    }
  }

  const out = new Map<string, Faculty[]>()

  for (const [domain, specsByEtab] of domainToSpecsByEtab) {
    const faculties: Faculty[] = []

    for (const [etabId, domainSpecs] of specsByEtab) {
      const etab = etabById.get(etabId)
      if (!etab) continue

      const base = mapEtablissementToFaculty(etab)
      faculties.push({
        ...base,
        cat: domain,
        programs: [...domainSpecs]
          .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
          .map((item) => item.nom),
      })
    }

    faculties.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    out.set(domain, faculties)
  }

  return out
}

function normalizeSpecialityKey(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function primaryDomainFromRows(rows: SpecialiteListItem[]): string | null {
  const domains = rows
    .map((row) => row.domaine?.trim())
    .filter(Boolean) as string[]

  if (domains.length === 0) return null

  const counts = new Map<string, number>()
  for (const domain of domains) {
    counts.set(domain, (counts.get(domain) || 0) + 1)
  }

  let best = domains[0]
  let bestCount = -1
  for (const [domain, count] of counts) {
    if (count > bestCount || (count === bestCount && domain.localeCompare(best, 'fr') < 0)) {
      best = domain
      bestCount = count
    }
  }

  return best
}

export function groupEtablissementsBySpeciality(
  etabs: Etablissement[],
  specs: SpecialiteListItem[]
): SpecialityBrowseEntry[] {
  const etabById = new Map(etabs.map((etab) => [etab.id, etab]))
  const etabIdsByUniversite = new Map<string, string[]>()

  for (const etab of etabs) {
    if (!etabIdsByUniversite.has(etab.universiteId)) {
      etabIdsByUniversite.set(etab.universiteId, [])
    }
    etabIdsByUniversite.get(etab.universiteId)!.push(etab.id)
  }

  const rowsBySpeciality = new Map<string, SpecialiteListItem[]>()

  for (const spec of specs) {
    const fallbackName = spec.codeOrientation?.trim()
    const name = spec.nom?.trim() || fallbackName
    if (!name) continue

    const key = normalizeSpecialityKey(name)
    if (!rowsBySpeciality.has(key)) rowsBySpeciality.set(key, [])

    const rows = rowsBySpeciality.get(key)!
    if (rows.some((row) => row.id === spec.id)) continue
    rows.push(spec)
  }

  const out: SpecialityBrowseEntry[] = []

  for (const [key, rows] of rowsBySpeciality) {
    const faculties: Faculty[] = []
    const seenEtabIds = new Set<string>()

    for (const row of rows) {
      const targetIds = new Set<string>()

      if (row.etablissement?.id) {
        targetIds.add(row.etablissement.id)
      } else if (row.universite?.id) {
        for (const etabId of etabIdsByUniversite.get(row.universite.id) || []) {
          targetIds.add(etabId)
        }
      }

      for (const etabId of targetIds) {
        if (seenEtabIds.has(etabId)) continue
        const etab = etabById.get(etabId)
        if (!etab) continue

        seenEtabIds.add(etabId)
        const relatedRows = rows.filter((candidate) => {
          if (candidate.etablissement?.id) return candidate.etablissement.id === etabId
          return candidate.universite?.id != null && candidate.universite.id === etab.universiteId
        })

        const base = mapEtablissementToFaculty(etab)
        const programs = [...new Set(relatedRows.map((candidate) => candidate.nom.trim()).filter(Boolean))]

        faculties.push({
          ...base,
          cat: primaryDomainFromRows(relatedRows) || base.cat,
          programs,
        })
      }
    }

    faculties.sort((a, b) => a.name.localeCompare(b.name, 'fr'))

    const displayName =
      rows.find((row) => row.nom?.trim())?.nom.trim() ||
      rows.find((row) => row.codeOrientation?.trim())?.codeOrientation.trim() ||
      key

    out.push({
      id: key,
      name: displayName,
      domaine: primaryDomainFromRows(rows),
      faculties,
      specialiteIds: rows.map((row) => row.id),
      codeOrientations: rows
        .map((row) => row.codeOrientation?.trim())
        .filter(Boolean) as string[],
    })
  }

  out.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  return out
}

export function facultyMatchesSearch(f: Faculty, q: string): boolean {
  const n = q.trim().toLowerCase()
  if (!n) return true
  if (f.name.toLowerCase().includes(n)) return true
  if (f.location.toLowerCase().includes(n)) return true
  if (f.sub.toLowerCase().includes(n)) return true
  return f.programs.some(p => p.toLowerCase().includes(n))
}

export function groupFacultiesByDomain(faculties: Faculty[]): Map<string, Faculty[]> {
  const m = new Map<string, Faculty[]>()
  for (const f of faculties) {
    const d = f.cat?.trim() || DOMAIN_AUTRES
    if (!m.has(d)) m.set(d, [])
    m.get(d)!.push(f)
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }
  return m
}

export function sortDomainKeys(keys: string[]): string[] {
  const rest = keys.filter(k => k !== DOMAIN_AUTRES).sort((a, b) => a.localeCompare(b, 'fr'))
  if (keys.includes(DOMAIN_AUTRES)) rest.push(DOMAIN_AUTRES)
  return rest
}
