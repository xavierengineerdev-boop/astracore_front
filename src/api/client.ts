const PRODUCTION_API = 'https://api.astracore.dev/api'

function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return PRODUCTION_API
  }
  return (
    (import.meta.env.VITE_API_URL as string) ||
    (import.meta.env.VITE_API_BASE as string) ||
    'http://localhost:3000/api'
  )
}

const API_BASE = getApiBase()

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export const AUTH_LOGOUT_EVENT = 'auth:logout'

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

async function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) throw new Error('No refresh token')
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body?.message ?? (Array.isArray(body?.message) ? body.message[0] : body?.error) ?? 'Refresh failed'
    throw new Error(msg)
  }
  const data = await res.json()
  const access = data?.data?.access_token ?? data?.access_token
  if (!access) throw new Error('No access token in refresh response')
  localStorage.setItem(ACCESS_KEY, access)
  return access
}

function dispatchLogout(): void {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT))
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken()
  if (!token) {
    clearTokens()
    dispatchLogout()
    throw new Error('No access token')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    try {
      const newToken = await doRefresh()
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(url, { ...options, headers })
    } catch {
      clearTokens()
      dispatchLogout()
      throw new Error('Сессия истекла. Войдите снова.')
    }
  }

  return res
}

export { API_BASE }
