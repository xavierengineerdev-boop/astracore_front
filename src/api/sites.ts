import { authenticatedFetch, API_BASE } from './client'

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

export type SiteItem = {
  _id: string
  url: string
  description: string
  token: string
  departmentId: string
  createdAt: string
  updatedAt: string
}

export async function getSitesByDepartment(departmentId: string): Promise<SiteItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/sites?departmentId=${encodeURIComponent(departmentId)}`)
  return parseResponse<SiteItem[]>(res)
}

export async function createSite(data: {
  url: string
  description?: string
  departmentId: string
}): Promise<SiteItem> {
  const res = await authenticatedFetch(`${API_BASE}/sites`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<SiteItem>(res)
}

export async function updateSite(
  id: string,
  data: { url?: string; description?: string },
): Promise<SiteItem> {
  const res = await authenticatedFetch(`${API_BASE}/sites/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<SiteItem>(res)
}

export async function deleteSite(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/sites/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}
