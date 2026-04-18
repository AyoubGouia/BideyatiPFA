import apiClient from './client'

export interface Universite {
  id: string
  nom: string
  nomAr?: string | null
  ville?: string | null
  region?: string | null
  siteweb?: string | null
  description?: string | null
}

export const universiteApi = {
  getAll: async (): Promise<Universite[]> => {
    const response = await apiClient.get<Universite[]>('/universites')
    return response.data
  },

  search: async (params: {
    q?: string
    city?: string
    region?: string
  }): Promise<Universite[]> => {
    const response = await apiClient.get<Universite[]>('/universites/search', {
      params,
    })
    return response.data
  },
}
