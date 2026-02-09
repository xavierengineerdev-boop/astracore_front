const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3000/api'

type ApiSuccess<T> = { statusCode: number; data: T; timestamp: string }
type ApiError = { statusCode: number; error: string; message: string | string[]; timestamp: string }

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json()
  if (!res.ok) {
    const err = body as ApiError
    const msg = Array.isArray(err.message) ? err.message[0] : err.message
    throw new Error(msg || err.error || 'Request failed')
  }
  return (body as ApiSuccess<T>).data
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return parseResponse<{ access_token: string; refresh_token: string }>(res)
}

export async function refresh(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  return parseResponse<{ access_token: string }>(res)
}

export async function me(accessToken?: string) {
  const token = accessToken ?? localStorage.getItem('access_token')
  if (!token) throw new Error('No access token')
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse<{ userId: string; email: string; role: string; firstName?: string; lastName?: string; lastLoginAt?: string; departmentId?: string }>(res)
}
