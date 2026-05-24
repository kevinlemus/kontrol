import { api } from './client'
import type { GenerateRequest, GenerateResponse } from './types'

export const generateApi = {
  generate: (req: GenerateRequest) =>
    api.post<GenerateResponse>('/api/v1/generate', req),
  schedule: (postId: string, platforms: Array<{ platformId: string; scheduledAt: string }>) =>
    api.post<void>('/api/v1/schedule', { postId, platforms }),
  publishNow: (postId: string) =>
    api.post<void>(`/api/v1/publish/${postId}`, {}),
}
