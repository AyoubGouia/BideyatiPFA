import type { Etablissement } from '../api/etablissementApi'
import type { SpecialiteListItem } from '../api/specialiteApi'
import { mapEtablissementToFaculty, type Faculty } from '../data/faculties'

export const DOMAIN_AUTRES = 'Autres'

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
