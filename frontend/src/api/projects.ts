import { api } from './client'
import type { ApiProject } from './types'

export const projectsApi = {
  list: () => api.get<ApiProject[]>('/api/v1/projects'),
  create: (data: Partial<ApiProject>) => api.post<ApiProject>('/api/v1/projects', data),
  update: (id: string, data: Partial<ApiProject>) =>
    api.put<ApiProject>(`/api/v1/projects/${id}`, data),
  activate: (id: string) => api.patch<void>(`/api/v1/projects/${id}/activate`),
}
