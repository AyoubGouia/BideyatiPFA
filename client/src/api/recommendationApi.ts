import apiClient from './client'

export interface MetierRecommandation {
  id: string
  titre: string
  secteur: string
  matchScore: number
  matchedTags: string[]
  linkedSpecialites: {
    id: string
    nom: string
    codeOrientation: string
  }[]
}

export const recommendationApi = {
  getMetierRecommandations: async (): Promise<MetierRecommandation[]> => {
    const response = await apiClient.get<MetierRecommandation[]>('/recommandations/metiers')
    return response.data
  },
}
