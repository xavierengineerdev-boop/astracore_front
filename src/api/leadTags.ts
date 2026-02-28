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

export type LeadTagItem = {
  _id: string
  name: string
  description: string
  color: string
  departmentId: string
  order: number
  createdAt: string
  updatedAt: string
}

export async function getLeadTagsByDepartment(departmentId: string): Promise<LeadTagItem[]> {
  const res = await authenticatedFetch(
    `${API_BASE}/lead-tags?departmentId=${encodeURIComponent(departmentId)}`,
  )
  return parseResponse<LeadTagItem[]>(res)
}

export async function createLeadTag(data: {
  name: string
  description?: string
  color?: string
  departmentId: string
}): Promise<LeadTagItem> {
  const res = await authenticatedFetch(`${API_BASE}/lead-tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<LeadTagItem>(res)
}

export async function updateLeadTag(
  id: string,
  data: { name?: string; description?: string; color?: string; departmentId?: string },
): Promise<LeadTagItem> {
  const res = await authenticatedFetch(`${API_BASE}/lead-tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<LeadTagItem>(res)
}

export async function deleteLeadTag(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/lead-tags/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}
