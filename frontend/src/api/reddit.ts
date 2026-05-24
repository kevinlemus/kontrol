import { api } from './client'
import type { ApiRedditSuggestion } from './types'

export const redditApi = {
  getSuggestions: (projectId: string) =>
    api.get<ApiRedditSuggestion[]>(`/api/v1/reddit/suggestions/${projectId}`),
  postComment: (suggestionId: string, commentText?: string) =>
    api.post<void>('/api/v1/reddit/post-comment', { suggestionId, commentText }),
  dismissSuggestion: (suggestionId: string) =>
    api.patch<void>(`/api/v1/reddit/suggestions/${suggestionId}/dismiss`),
}
