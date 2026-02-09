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

export type DepartmentItem = {
  _id: string
  name: string
  managerId?: string
  createdAt: string
  updatedAt: string
}

export type UserItemBrief = {
  _id: string
  email: string
  role: string
  firstName: string
  lastName: string
  departmentId?: string
  isActive: boolean
}

export type DepartmentDetail = DepartmentItem & {
  manager?: UserItemBrief | null
  employees: UserItemBrief[]
  employeesCount: number
  statusesCount: number
  sitesCount: number
}

export async function getDepartments(): Promise<DepartmentItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/departments`)
  return parseResponse<DepartmentItem[]>(res)
}

export async function getDepartment(id: string): Promise<DepartmentDetail> {
  const res = await authenticatedFetch(`${API_BASE}/departments/${id}`)
  return parseResponse<DepartmentDetail>(res)
}

export async function createDepartment(data: { name: string; managerId?: string }): Promise<DepartmentItem> {
  const res = await authenticatedFetch(`${API_BASE}/departments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<DepartmentItem>(res)
}

export async function updateDepartment(
  id: string,
  data: { name?: string; managerId?: string },
): Promise<DepartmentItem> {
  const res = await authenticatedFetch(`${API_BASE}/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<DepartmentItem>(res)
}

export async function deleteDepartment(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/departments/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}
