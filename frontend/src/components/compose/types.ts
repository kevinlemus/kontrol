export type PlatformId = 'IG' | 'TT' | 'LI' | 'RD' | 'X' | 'FB' | 'YT' | 'ST' | 'IT' | 'GJ'
export type PostStatus = 'pending' | 'generating' | 'draft' | 'approved' | 'skipped'
export type PostType = 'post' | 'story' | 'short' | 'reel' | 'tweet' | 'text' | 'announcement' | 'devlog'
export type ViewMode = 'edit' | 'preview'

export const PLATFORM_POST_TYPES: Partial<Record<PlatformId, PostType[]>> = {
  IG: ['post', 'story', 'reel'],
  TT: ['post', 'story'],
  YT: ['short', 'post'],
}

export interface Platform {
  id: PlatformId
  name: string
  postType: PostType
  gradient: string
  gradientColors: string[]
}

export interface PlatformDraft {
  platformId: PlatformId
  status: PostStatus
  content: string
  title?: string
  subreddit?: string
  subredditReasoning?: string  // Claude's one-sentence reasoning for the chosen subreddit
  hashtags?: string[]
  onScreenText?: string
  selectedPostType: PostType
  postPlatformId?: string
}

export interface ComposeState {
  projectName: string
  prompt: string
  mediaUrl: string | null
  activePlatformId: PlatformId
  drafts: Record<PlatformId, PlatformDraft>
  generated: boolean
}
