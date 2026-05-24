const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function authHeaders(): HeadersInit {
  const raw = localStorage.getItem('kontrol_auth')
  const auth = raw ? (JSON.parse(raw) as { token?: string }) : null
  return {
    'Content-Type': 'application/json',
    ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
  }
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    voice_profile?: string
    onboarding_completed?: boolean
  }
}

export const authApi = {
  register: (name: string, email: string, password: string): Promise<LoginResponse> =>
    fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(async r => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? `Register failed: ${r.status}`)
      }
      return r.json() as Promise<LoginResponse>
    }),

  login: (email: string, password: string): Promise<LoginResponse> =>
    fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async r => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Invalid email or password')
      }
      return r.json() as Promise<LoginResponse>
    }),

  getMe: (): Promise<LoginResponse['user']> =>
    fetch(`${BASE}/api/v1/auth/me`, { headers: authHeaders() })
      .then(r => r.json() as Promise<LoginResponse['user']>),

  updateSettings: (data: {
    name?: string
    email?: string
    voiceProfile?: string
    onboardingCompleted?: boolean
  }) =>
    fetch(`${BASE}/api/v1/auth/settings`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(r => r.json()),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetch(`${BASE}/api/v1/auth/password`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(r => r.json() as Promise<{ message?: string; error?: string }>),

  analyzeUrl: (url: string): Promise<{
    name?: string
    what_it_is?: string
    who_its_for?: string
    vibe?: string
    suggested_tagline?: string
    industry?: string
    competitors?: string | string[]
  }> =>
    fetch(`${BASE}/api/v1/projects/analyze-url`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ url }),
    }).then(r => r.json()),
}

// FRONTEND-AGENT: api/auth complete
