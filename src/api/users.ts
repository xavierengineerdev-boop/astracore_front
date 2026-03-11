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

export type UserItem = {
  _id: string
  email: string
  role: string
  firstName: string
  lastName: string
  phone: string
  sip: string
  isActive: boolean
  lastLoginAt?: string
  departmentId?: string
  createdAt: string
  updatedAt: string
}

export async function getUsers(): Promise<UserItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/users`)
  return parseResponse<UserItem[]>(res)
}

export async function getUser(id: string): Promise<UserItem> {
  const res = await authenticatedFetch(`${API_BASE}/users/${id}`)
  return parseResponse<UserItem>(res)
}

export async function createUser(data: {
  email: string
  password: string
  role: string
  firstName?: string
  lastName?: string
  phone?: string
  sip?: string
  isActive?: boolean
  departmentId?: string
}): Promise<UserItem> {
  const res = await authenticatedFetch(`${API_BASE}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<UserItem>(res)
}

export async function updateUser(
  id: string,
  data: {
    email?: string
    role?: string
    firstName?: string
    lastName?: string
    phone?: string
    sip?: string
    isActive?: boolean
    departmentId?: string
  },
): Promise<UserItem> {
  const res = await authenticatedFetch(`${API_BASE}/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<UserItem>(res)
}

export async function deleteUser(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/users/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

const SETTINGS_KEY_LEADS_TABLE_COLUMN_WIDTHS = 'leads_table_column_widths'
export const SETTINGS_KEY_LEADS_TABLE_COLUMN_ORDER = 'leads_table_column_order'
const SETTINGS_KEY_LEADS_TABLE_COLUMN_VISIBILITY = 'leads_table_column_visibility'

export type LeadsTableColumnWidths = Record<string, number>
export type LeadsTableColumnVisibility = Record<string, boolean>

export async function getMySettings(): Promise<Record<string, unknown>> {
  const res = await authenticatedFetch(`${API_BASE}/users/me/settings`)
  return parseResponse<Record<string, unknown>>(res)
}

export async function updateMySetting(key: string, value: unknown): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/users/me/settings`, {
    method: 'PATCH',
    body: JSON.stringify({ key, value }),
  })
  await parseResponse<{ ok: boolean }>(res)
}

export async function getLeadsTableColumnWidths(): Promise<LeadsTableColumnWidths> {
  const settings = await getMySettings()
  const raw = settings[SETTINGS_KEY_LEADS_TABLE_COLUMN_WIDTHS]
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'number' && v >= 80) out[k] = v
    }
    return out
  }
  return {}
}

export async function saveLeadsTableColumnWidths(widths: LeadsTableColumnWidths): Promise<void> {
  await updateMySetting(SETTINGS_KEY_LEADS_TABLE_COLUMN_WIDTHS, widths)
}

export async function getLeadsTableColumnOrder(): Promise<string[]> {
  const settings = await getMySettings()
  const raw = settings[SETTINGS_KEY_LEADS_TABLE_COLUMN_ORDER]
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) return raw as string[]
  return []
}

export async function saveLeadsTableColumnOrder(order: string[]): Promise<void> {
  await updateMySetting(SETTINGS_KEY_LEADS_TABLE_COLUMN_ORDER, order)
}

export async function getLeadsTableColumnVisibility(): Promise<LeadsTableColumnVisibility> {
  const settings = await getMySettings()
  const raw = settings[SETTINGS_KEY_LEADS_TABLE_COLUMN_VISIBILITY]
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'boolean') out[k] = v
    }
    return out
  }
  return {}
}

export async function saveLeadsTableColumnVisibility(visibility: LeadsTableColumnVisibility): Promise<void> {
  await updateMySetting(SETTINGS_KEY_LEADS_TABLE_COLUMN_VISIBILITY, visibility)
}

export type LeadItemWithMeta = import('./leads').LeadItem & {
  statusName?: string
  departmentName?: string
  /** Дата последнего комментария (когда звонили) */
  lastCommentAt?: string
}
export type UserLeadsListResult = {
  items: LeadItemWithMeta[]
  total: number
  skip: number
  limit: number
}

export type UserLeadStatsResult = {
  total: number
  byStatus: { statusId: string; statusName: string; count: number }[]
  overTime: { date: string; count: number }[]
}

export async function getUserLeads(
  userId: string,
  params?: {
    skip?: number
    limit?: number
    name?: string
    phone?: string
    email?: string
    statusId?: string
    departmentId?: string
    /** Фильтр: дата последнего комментария от (когда звонили) — ISO или YYYY-MM-DD */
    lastCommentDateFrom?: string
    /** Фильтр: дата последнего комментария до (когда звонили) — ISO или YYYY-MM-DD */
    lastCommentDateTo?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  },
): Promise<UserLeadsListResult> {
  const sp = new URLSearchParams()
  if (params?.skip != null) sp.set('skip', String(params.skip))
  if (params?.limit != null) sp.set('limit', String(params.limit))
  if (params?.name?.trim()) sp.set('name', params.name.trim())
  if (params?.phone?.trim()) sp.set('phone', params.phone.trim())
  if (params?.email?.trim()) sp.set('email', params.email.trim())
  if (params?.statusId?.trim()) sp.set('statusId', params.statusId.trim())
  if (params?.departmentId?.trim()) sp.set('departmentId', params.departmentId.trim())
  if (params?.lastCommentDateFrom?.trim()) sp.set('lastCommentDateFrom', params.lastCommentDateFrom.trim())
  if (params?.lastCommentDateTo?.trim()) sp.set('lastCommentDateTo', params.lastCommentDateTo.trim())
  if (params?.sortBy?.trim()) sp.set('sortBy', params.sortBy.trim())
  if (params?.sortOrder) sp.set('sortOrder', params.sortOrder)
  const q = sp.toString()
  const res = await authenticatedFetch(`${API_BASE}/users/${userId}/leads${q ? `?${q}` : ''}`)
  return parseResponse<UserLeadsListResult>(res)
}

export async function getUserLeadStats(userId: string, days?: number): Promise<UserLeadStatsResult> {
  const sp = days != null ? `?days=${days}` : ''
  const res = await authenticatedFetch(`${API_BASE}/users/${userId}/lead-stats${sp}`)
  return parseResponse<UserLeadStatsResult>(res)
}
