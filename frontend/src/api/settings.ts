import { api } from './client'

export interface UserSettings {
  id?: string
  userName: string
}

const STORAGE_KEY = 'kontrol_user_name'

export const settingsApi = {
  getUserSettings: (): Promise<UserSettings> =>
    (api.get('/api/v1/settings/user') as Promise<UserSettings>).catch(() => ({
      userName: localStorage.getItem(STORAGE_KEY) ?? 'Creator',
    })),

  updateUserSettings: (data: UserSettings): Promise<UserSettings> => {
    localStorage.setItem(STORAGE_KEY, data.userName)
    return (api.put('/api/v1/settings/user', data) as Promise<UserSettings>).catch(() => data)
  },

  /** Synchronous read — for initial state that doesn't need an API round-trip */
  getCachedUserName: (): string =>
    localStorage.getItem(STORAGE_KEY) ?? 'Creator',
}

// FRONTEND-AGENT: api/settings complete
