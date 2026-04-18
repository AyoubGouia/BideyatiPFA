import axios from 'axios'
import apiClient from './client'

export interface AiSpecialityOverviewAnalysis {
  label: 'safe' | 'balanced' | 'ambitious' | 'risky'
  confidence: 'low' | 'medium' | 'high'
  summary: string
  strengths: string[]
  risks: string[]
  advice: string[]
  disclaimer: string
}

export interface AiSpecialityOverviewResponse {
  specialiteId: string
  yearRequested: number | null
  yearUsed: number | null
  completeness: {
    hasSection: boolean
    hasMoyenne: boolean
    hasNotes: boolean
    hasQuestionnaire: boolean
    hasHistoricalScore: boolean
    hasCapacity: boolean
  }
  analysis: AiSpecialityOverviewAnalysis
}

type OverviewParams = {
  specialiteId: string
  year?: number
}

export const aiApi = {
  getSpecialityOverview: async (
    params: OverviewParams
  ): Promise<AiSpecialityOverviewResponse> => {
    const response = await apiClient.post<AiSpecialityOverviewResponse>(
      '/ai/speciality-overview',
      params
    )
    return response.data
  },
}

export const isAxiosApiError = (error: unknown): error is {
  response?: {
    status: number
    data?: {
      error?: string
    }
  }
} => axios.isAxiosError(error)
