import { api } from './client'

export interface AnalyticsAlert {
  type: 'high_performer' | 'posting_gap' | 'best_time'
  message: string
  postId?: string | null
  action: 'boost' | 'compose' | 'schedule'
  urgency: 'high' | 'medium' | 'low'
}

export interface AnalyticsOverview {
  totalPosts: number
  avgEngagement: number | null
  bestPlatform: string | null
  bestTime: string | null
  hasEnoughData: boolean
}

export interface AnalyticsPost {
  id: string
  platform: string
  content: string
  performanceScore: number
  publishedAt: string
}

export interface AnalyticsInsight {
  insightText: string
  updatedAt: string
}

export interface PlatformAnalytics {
  platform: string
  postCount: number
  avgEngagement: number | null
  topPosts: AnalyticsPost[]
}

export interface WeeklyReport {
  id: string
  summary: string
  metrics: { label: string; value: string }[]
  recommendations: { text: string }[]
  generatedAt: string
}

export interface HookInsight {
  hookStyle: string
  avgScore: number
  recommendation: string
}

export const analyticsApi = {
  overview: (projectId: string): Promise<AnalyticsOverview> =>
    api.get(`/api/v1/analytics/overview?projectId=${projectId}`),

  posts: (projectId: string, platform?: string, limit = 20): Promise<AnalyticsPost[]> =>
    api.get(`/api/v1/analytics/posts?projectId=${projectId}${platform ? `&platform=${platform}` : ''}&limit=${limit}`),

  insights: (projectId: string): Promise<AnalyticsInsight> =>
    api.get(`/api/v1/analytics/insights?projectId=${projectId}`),

  platform: (projectId: string, platform: string): Promise<PlatformAnalytics> =>
    api.get(`/api/v1/analytics/platform?projectId=${projectId}&platform=${platform}`),

  weeklyReport: (projectId: string): Promise<WeeklyReport> =>
    api.get(`/api/v1/reports/weekly?projectId=${projectId}`),

  reports: (projectId: string): Promise<WeeklyReport[]> =>
    api.get(`/api/v1/reports?projectId=${projectId}`),

  hookInsights: (projectId: string, platform?: string): Promise<HookInsight[]> =>
    api.get(`/api/v1/hooks/insights?projectId=${projectId}${platform ? `&platform=${platform}` : ''}`),

  generateReport: (projectId: string): Promise<WeeklyReport> =>
    api.post(`/api/v1/reports/generate`, { projectId }),

  alerts: (projectId: string): Promise<AnalyticsAlert[]> =>
    api.get(`/api/v1/analytics/alerts?projectId=${projectId}`),
}
