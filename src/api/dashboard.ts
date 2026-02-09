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

export type DashboardSummary = {
  usersCount: number
  departmentsCount: number
  leadsCount: number
}

export type DashboardLeadsByStatusItem = {
  statusId: string
  statusName: string
  count: number
}

export type DashboardLeadsOverTimeItem = {
  date: string
  count: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await authenticatedFetch(`${API_BASE}/dashboard/summary`)
  return parseResponse<DashboardSummary>(res)
}

export async function getDashboardLeadsByStatus(): Promise<DashboardLeadsByStatusItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/dashboard/leads-by-status`)
  return parseResponse<DashboardLeadsByStatusItem[]>(res)
}

export async function getDashboardLeadsOverTime(days?: number): Promise<DashboardLeadsOverTimeItem[]> {
  const sp = days != null ? `?days=${days}` : ''
  const res = await authenticatedFetch(`${API_BASE}/dashboard/leads-over-time${sp}`)
  return parseResponse<DashboardLeadsOverTimeItem[]>(res)
}

export type DashboardRecentLeadItem = {
  _id: string
  name: string
  lastName: string
  statusName: string
  departmentName: string
  createdAt: string
}

export type DashboardDepartmentSummaryItem = {
  departmentId: string
  departmentName: string
  leadsCount: number
}

export type DashboardTopAssigneeItem = {
  assigneeId: string
  assigneeName: string
  leadsCount: number
}

export type DashboardAttentionCounts = {
  leadsWithoutStatus: number
  leadsUnassigned: number
}

export type DashboardWeekEventItem = {
  type: 'reminder' | 'task'
  id: string
  leadId: string
  leadName?: string
  title: string
  date: string
  dateTime?: string
}

export async function getDashboardRecentLeads(limit?: number): Promise<DashboardRecentLeadItem[]> {
  const sp = limit != null ? `?limit=${limit}` : ''
  const res = await authenticatedFetch(`${API_BASE}/dashboard/recent-leads${sp}`)
  return parseResponse<DashboardRecentLeadItem[]>(res)
}

export async function getDashboardDepartmentsSummary(): Promise<DashboardDepartmentSummaryItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/dashboard/departments-summary`)
  return parseResponse<DashboardDepartmentSummaryItem[]>(res)
}

export async function getDashboardTopAssignees(limit?: number): Promise<DashboardTopAssigneeItem[]> {
  const sp = limit != null ? `?limit=${limit}` : ''
  const res = await authenticatedFetch(`${API_BASE}/dashboard/top-assignees${sp}`)
  return parseResponse<DashboardTopAssigneeItem[]>(res)
}

export async function getDashboardAttentionCounts(): Promise<DashboardAttentionCounts> {
  const res = await authenticatedFetch(`${API_BASE}/dashboard/attention-counts`)
  return parseResponse<DashboardAttentionCounts>(res)
}

export async function getDashboardWeekEvents(): Promise<DashboardWeekEventItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/dashboard/week-events`)
  return parseResponse<DashboardWeekEventItem[]>(res)
}
