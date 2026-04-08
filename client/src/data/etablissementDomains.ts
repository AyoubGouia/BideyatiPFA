/**
 * Fixed domain list for établissement browsing (French UI labels).
 * Each domain uses GET /api/etablissements/search?q=… for one or more keywords (merged, deduped).
 */
export interface EtablissementDomainConfig {
  label: string
  /** Backend search uses establishment name contains; multiple keywords widen recall */
  searchQueries: string[]
}

export const ETABLISSEMENT_DOMAIN_CONFIG: EtablissementDomainConfig[] = [
  { label: 'Informatique', searchQueries: ['informatique'] },
  { label: 'Santé', searchQueries: ['santé', 'sante', 'médecine', 'medecine'] },
  { label: 'Business', searchQueries: ['business', 'commerce', 'gestion'] },
  { label: 'Droit', searchQueries: ['droit', 'juridique'] },
  { label: 'Sciences', searchQueries: ['sciences', 'science'] },
  { label: 'Ingénierie', searchQueries: ['ingénierie', 'ingenierie', 'génie', 'genie'] },
  { label: 'Mécanique', searchQueries: ['mécanique', 'mecanique'] },
  { label: 'Électrique', searchQueries: ['électrique', 'electrique'] },
  { label: 'Électronique', searchQueries: ['électronique', 'electronique'] },
  { label: 'Agriculture', searchQueries: ['agriculture', 'agronomie'] },
  { label: 'Arts', searchQueries: ['arts', 'art'] },
  { label: 'Communication', searchQueries: ['communication', 'médias', 'medias'] },
  { label: 'Éducation', searchQueries: ['éducation', 'education', 'enseignement'] },
  { label: 'Sport', searchQueries: ['sport', 'staps'] },
  { label: 'Tourisme', searchQueries: ['tourisme', 'hôtellerie', 'hotellerie'] },
  { label: 'Finance', searchQueries: ['finance', 'comptabilité', 'comptabilite'] },
  { label: 'Architecture', searchQueries: ['architecture', 'urbanisme'] },
]
