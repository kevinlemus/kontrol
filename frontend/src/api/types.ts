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
}

export interface GenerateRequest {
  projectId: string
  prompt: string
  platforms: string[]
}

export interface GenerateResponse {
  postId: string
  drafts: Record<string, ApiDraft>
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
