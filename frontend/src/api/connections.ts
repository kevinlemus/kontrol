import { api } from './client'

export interface ConnectionStatus {
  platform: string
  connected: boolean
  accountHandle: string | null
}

export const connectionsApi = {
  list: (projectId?: string) =>
    api.get<ConnectionStatus[]>(
      projectId
        ? `/api/v1/connections?project_id=${projectId}`
        : '/api/v1/connections'
    ),

  disconnect: (platform: string, projectId?: string) => {
    const path = projectId
      ? `/api/v1/connections/${platform}?project_id=${projectId}`
      : `/api/v1/connections/${platform}`
    return fetch(
      `${(import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ?? 'http://localhost:8080'}${path}`,
      {
        method: 'DELETE',
        headers: (() => {
          const raw = localStorage.getItem('kontrol_auth')
          const auth = raw ? (JSON.parse(raw) as { token?: string }) : null
          return { ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}) }
        })(),
      }
    ).then(r => { if (!r.ok) throw new Error('Disconnect failed') })
  },
}
