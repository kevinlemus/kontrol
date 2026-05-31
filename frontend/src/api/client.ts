const BASE = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ?? 'http://localhost:8080'

const IS_DEV = import.meta.env.DEV

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('kontrol_auth')
    if (!stored) return null
    return (JSON.parse(stored) as { token?: string }).token ?? null
  } catch { return null }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const method = options?.method ?? 'GET'
  const url = `${BASE}${path}`

  if (IS_DEV) {
    console.log(`API request: ${method} ${url}`, 'token:', !!token)
  }

  // 15-second timeout prevents indefinite loading when the backend is unreachable
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      signal: controller.signal,
      ...options,
    })
    if (!res.ok) {
      const body = await res.text()
      if (IS_DEV) {
        console.error(`API error: ${method} ${url} → ${res.status}`, body)
      }
      throw new Error(`API ${res.status}: ${body}`)
    }
    return res.json() as Promise<T>
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  get:   <T>(path: string) => apiFetch<T>(path),
  post:  <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:   <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}

// FRONTEND-AGENT: api/client complete
