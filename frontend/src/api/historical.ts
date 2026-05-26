import { api } from './client'

export const historicalApi = {
  import: (platform: string, projectId?: string) =>
    api.post<{ imported: number; message: string; success: boolean }>(
      `/api/v1/historical/import/${platform}${projectId ? `?project_id=${projectId}` : ''}`,
      {}
    ),
  status: (projectId: string) =>
    api.get<Array<{ platform: string; postCount: number; hasData: boolean; voiceSummary?: string; analyzedPostCount?: number }>>(
      `/api/v1/historical/status?project_id=${projectId}`
    ),
}
