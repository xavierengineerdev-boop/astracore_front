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

export type StatusItem = {
  _id: string
  name: string
  description: string
  color: string
  departmentId: string
  order: number
  createdAt: string
  updatedAt: string
}

export async function getStatusesByDepartment(departmentId: string): Promise<StatusItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/statuses?departmentId=${encodeURIComponent(departmentId)}`)
  return parseResponse<StatusItem[]>(res)
}

export async function getStatus(id: string): Promise<StatusItem> {
  const res = await authenticatedFetch(`${API_BASE}/statuses/${id}`)
  return parseResponse<StatusItem>(res)
}

export async function createStatus(data: {
  name: string
  description?: string
  color?: string
  departmentId: string
}): Promise<StatusItem> {
  const res = await authenticatedFetch(`${API_BASE}/statuses`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<StatusItem>(res)
}

export async function updateStatus(
  id: string,
  data: { name?: string; description?: string; color?: string; departmentId?: string },
): Promise<StatusItem> {
  const res = await authenticatedFetch(`${API_BASE}/statuses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<StatusItem>(res)
}

export async function deleteStatus(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/statuses/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}
