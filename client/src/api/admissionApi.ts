import apiClient from './client'

export interface StatistiqueAdmissionRow {
  id: string
  annee: number
  scoreDernierAdmis: number
  scoreMinimum?: number | null
  tauxAdmission?: number | null
  section: { id: string; nom: string } | null
}

export interface CapaciteAdmissionRow {
  id: string
  annee: number
  tour: string
  capacite: number
  section: { id: string; nom: string } | null
}

function is404(e: unknown): boolean {
  return Boolean(
    e &&
      typeof e === 'object' &&
      'response' in e &&
      (e as { response?: { status?: number } }).response?.status === 404
  )
}

export const statistiquesAdmissionApi = {
  getBySpecialite: async (
    specialiteId: string
  ): Promise<StatistiqueAdmissionRow[]> => {
    try {
      const res = await apiClient.get<StatistiqueAdmissionRow[]>(
        `/statistiques-admission/by-specialite/${specialiteId}`
      )
      return res.data
    } catch (e) {
      if (is404(e)) return []
      throw e
    }
  },
}

export const capacitesAdmissionApi = {
  getBySpecialite: async (
    specialiteId: string
  ): Promise<CapaciteAdmissionRow[]> => {
    try {
      const res = await apiClient.get<CapaciteAdmissionRow[]>(
        `/capacites-admission/by-specialite/${specialiteId}`
      )
      return res.data
    } catch (e) {
      if (is404(e)) return []
      throw e
    }
  },
}
