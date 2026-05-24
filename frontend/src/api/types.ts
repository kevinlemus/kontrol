export interface ApiProject {
  id: string
  name: string
  whatItIs: string | null
  whoItsFor: string | null
  vibe: string | null
  currentStatus: string | null
  active: boolean
}

export interface ApiDraft {
  platformId: string
  content: string
  title?: string | null
  postType?: string | null
  status?: string
  selectedSubreddit?: string | null   // e.g. "bedroomproducers" (without r/)
  subredditReasoning?: string | null  // e.g. "Best fit — discusses vocal recording"
  postPlatformId?: string | null
}

export interface ApiSubredditMonitor {
  id: string
  subreddit: string
  active: boolean
  lastPostedAt?: string | null
  engagementScore?: number
  coolingDown: boolean
  hoursUntilEligible: number
}

export interface GenerateRequest {
  projectId: string
  prompt: string
  platforms: string[]
}

export interface GenerateResponse {
  postId: string
  drafts: Record<string, ApiDraft>
  insights?: PerformanceInsightDto[]
}

export interface ApiRedditSuggestion {
  id: string
  subreddit: string
  redditPostTitle: string
  redditPostUrl: string
  suggestedComment: string
  status: 'pending' | 'posted' | 'dismissed'
  postedAt?: string | null
}

export interface PerformanceInsightDto {
  platform: string
  totalPosts: number
  hasEnoughData: boolean
  overrideAvgScore: number | null
  claudeAvgScore: number | null
  overrideImprovementPct: number | null
  bestHour: number | null
  bestDayOfWeek: number | null
  bestHourLabel: string | null
  bestDayLabel: string | null
  confidenceLabel: string   // "Learning..." or "Based on your data"
  insightSummary: string
}

export interface SmartScheduleTimingDto {
  usingPersonalizedData: boolean
  dataMessage: string
  timings: Record<string, {
    hour: number
    dayOfWeek: number
    personalized: boolean
    label: string
  }>
}
