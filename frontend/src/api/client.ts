const BASE = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ?? 'http://localhost:8080'

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('kontrol_auth')
    if (!stored) return null
    return (JSON.parse(stored) as { token?: string }).token ?? null
  } catch { return null }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export const api = {
  get:   <T>(path: string) => apiFetch<T>(path),
  post:  <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:   <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
}

// FRONTEND-AGENT: api/client complete
