import { api } from './client'

export interface StrategySuggestion {
  id: string
  title: string
  platform: string
  urgency: 'high' | 'medium' | 'low'
  reason: string
  contentType: string
  suggestedPrompt: string
}

export interface CompetitorAnalysis {
  competitorName: string
  postingFrequency: string
  topContentTypes: string[]
  engagementPatterns: string
  differentiationTips: string[]
  analyzedAt: string
}

export interface CompetitorSuggestion {
  name: string
  platform: string
}

export interface AdCampaign {
  id: string
  platform: string
  budget: number
  reach: number
  clicks: number
  status: 'active' | 'paused' | 'ended'
}

export const strategyApi = {
  suggestions: (projectId: string): Promise<StrategySuggestion[]> =>
    api.get(`/api/v1/strategy/suggestions?projectId=${projectId}`),

  analyzeCompetitor: (payload: {
    projectId: string
    competitorName: string
    platform: string
  }): Promise<CompetitorAnalysis> =>
    api.post('/api/v1/competitors/analyze', payload),

  suggestCompetitors: (projectId: string): Promise<CompetitorSuggestion[]> =>
    api.get(`/api/v1/competitors/suggest?projectId=${projectId}`),

  createAd: (payload: {
    postId: string
    platform: string
    dailyBudget: number
    durationDays: number | null
    audience: object
  }): Promise<{ adId: string }> =>
    api.post('/api/v1/ads/create', payload),

  updateAd: (adId: string, action: 'pause' | 'resume' | 'stop'): Promise<void> =>
    api.put(`/api/v1/ads/${adId}`, { action }),
}
