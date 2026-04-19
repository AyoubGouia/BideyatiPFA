import apiClient from './client'

export interface FavoriItem {
  id: string
  dateAjout: string
  etablissementId?: string
  specialiteId?: string
  etablissement?: any
  specialite?: any
}

export const favorisApi = {
  toggle: async (targetId: string, type: 'etablissement' | 'specialite'): Promise<{ favorited: boolean }> => {
    const response = await apiClient.post('/favoris/toggle', { targetId, type })
    return response.data
  },

  getAll: async (): Promise<FavoriItem[]> => {
    const response = await apiClient.get('/favoris')
    return response.data
  },

  check: async (targetId: string, type: 'etablissement' | 'specialite'): Promise<boolean> => {
    const response = await apiClient.get('/favoris/check', { params: { targetId, type } })
    return response.data.favorited
  }
}
