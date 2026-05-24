import { api } from './client'
import type { PerformanceInsightDto, SmartScheduleTimingDto } from './types'

export const performanceApi = {
  getInsights: (projectId: string, platform: string): Promise<PerformanceInsightDto> =>
    api.get(`/api/v1/performance/insights/${projectId}/${platform}`),

  getScheduleTiming: (projectId: string, platforms: string[]): Promise<SmartScheduleTimingDto> =>
    api.get(`/api/v1/performance/schedule-timing/${projectId}?platforms=${platforms.join(',')}`),

  getSubredditScores: (projectId: string): Promise<Record<string, number>> =>
    api.get(`/api/v1/performance/subreddit-scores/${projectId}`),

  finalizePostPlatform: (postPlatformId: string, finalContent: string): Promise<void> =>
    api.patch(`/api/v1/posts/platforms/${postPlatformId}/finalize`, { finalContent }),
}
