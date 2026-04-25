import apiClient from './client'

/** Shape returned by GET /api/specialites (list select includes etablissement + domaine). */
export interface SpecialiteListItem {
  id: string
  nom: string
  codeOrientation: string
  domaine?: string | null
  etablissement?: {
    id: string
    nom: string
    nomAr?: string
    gouvernorat?: string
  } | null
  /** When set without etablissement, link specialty to all établissements of this université */
  universite?: {
    id: string
    nom?: string
    ville?: string
  } | null
}

export interface SpecialitesSearchResponse {
  data: SpecialiteListItem[]
  total: number
  skip?: number
  take?: number
}

export interface SpecialiteDetail {
  id: string
  nom: string
  codeOrientation: string
  formuleBrute?: string | null
  domaine?: string | null
  metiers?: {
    metier: {
      id: string
      titre: string
      secteur: string
      tags: string[]
    }
  }[]
  statistiquesAdmissions?: {
    id: string
    annee: number
    scoreDernierAdmis: number
    scoreMinimum?: number | null
    tauxAdmission?: number | null
    section: { id: string; nom: string } | null
  }[]
  etablissement?: SpecialiteListItem['etablissement']
  universite?: SpecialiteListItem['universite']
}

export const specialiteApi = {
  getAll: async (): Promise<SpecialiteListItem[]> => {
    const response = await apiClient.get<SpecialiteListItem[]>('/specialites')
    return response.data
  },

  getById: async (id: string): Promise<SpecialiteDetail> => {
    const response = await apiClient.get<SpecialiteDetail>(`/specialites/${id}`)
    return response.data
  },

  searchPage: async (params: {
    etablissementId?: string
    universiteId?: string
    skip?: number
    take?: number
  }): Promise<SpecialitesSearchResponse> => {
    const response = await apiClient.get<SpecialitesSearchResponse>('/specialites/search', {
      params: { ...params, take: params.take ?? 200 },
    })
    return response.data
  },

  /** Paginate until all rows fetched for given filters */
  searchAll: async (params: {
    etablissementId?: string
    universiteId?: string
  }): Promise<SpecialiteListItem[]> => {
    const take = 200
    let skip = 0
    const out: SpecialiteListItem[] = []
    for (;;) {
      const { data, total } = await specialiteApi.searchPage({ ...params, skip, take })
      out.push(...data)
      if (out.length >= total || data.length === 0) break
      skip += take
    }
    return out
  },
}
