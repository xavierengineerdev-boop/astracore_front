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

export type LeadSourceMeta = {
  ip?: string
  userAgent?: string
  referrer?: string
  screen?: string
  language?: string
  platform?: string
  timezone?: string
  deviceMemory?: string
  hardwareConcurrency?: string
  extra?: Record<string, unknown>
}

export type LeadItem = {
  _id: string
  name: string
  lastName: string
  phone: string
  phone2?: string
  email: string
  email2?: string
  departmentId: string
  statusId: string | null
  source: string
  siteId: string | null
  /** ID тега источника лида (откуда пришёл) */
  leadTagId?: string | null
  sourceMeta?: LeadSourceMeta
  createdBy: string
  assignedTo: string[]
  comment?: string
  createdAt: string
  updatedAt: string
}

export type LeadListResult = {
  items: LeadItem[]
  total: number
  skip: number
  limit: number
}

export type LeadListFilters = {
  name?: string
  phone?: string
  email?: string
  statusId?: string
  assignedTo?: string
}

export type LeadListSort = {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getLeadsByDepartment(
  departmentId: string,
  params?: {
    skip?: number
    limit?: number
    name?: string
    phone?: string
    email?: string
    search?: string
    statusId?: string
    assignedTo?: string
    leadTagId?: string
    unassignedOnly?: boolean
    dateFrom?: string
    dateTo?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  },
): Promise<LeadListResult> {
  const sp = new URLSearchParams()
  sp.set('departmentId', departmentId)
  if (params?.skip != null) sp.set('skip', String(params.skip))
  if (params?.limit != null) sp.set('limit', String(params.limit))
  if (params?.search?.trim()) sp.set('search', params.search.trim())
  else {
    if (params?.name?.trim()) sp.set('name', params.name.trim())
    if (params?.phone?.trim()) sp.set('phone', params.phone.trim())
    if (params?.email?.trim()) sp.set('email', params.email.trim())
  }
  if (params?.statusId?.trim()) sp.set('statusId', params.statusId.trim())
  if (params?.assignedTo?.trim()) sp.set('assignedTo', params.assignedTo.trim())
  if (params?.leadTagId?.trim()) sp.set('leadTagId', params.leadTagId.trim())
  if (params?.unassignedOnly === true) sp.set('unassignedOnly', 'true')
  if (params?.dateFrom?.trim()) sp.set('dateFrom', params.dateFrom.trim())
  if (params?.dateTo?.trim()) sp.set('dateTo', params.dateTo.trim())
  if (params?.sortBy?.trim()) sp.set('sortBy', params.sortBy.trim())
  if (params?.sortOrder) sp.set('sortOrder', params.sortOrder)
  const res = await authenticatedFetch(`${API_BASE}/leads?${sp}`)
  return parseResponse<LeadListResult>(res)
}

export async function getLead(id: string): Promise<LeadItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${id}`)
  return parseResponse<LeadItem>(res)
}

export async function createLead(data: {
  name: string
  lastName?: string
  phone?: string
  phone2?: string
  email?: string
  email2?: string
  departmentId: string
  statusId?: string
  comment?: string
  source?: string
  siteId?: string
  assignedTo?: string[]
  leadTagId?: string | null
}): Promise<LeadItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<LeadItem>(res)
}

export async function updateLead(
  id: string,
  data: { name?: string; lastName?: string; phone?: string; phone2?: string; email?: string; email2?: string; statusId?: string; assignedTo?: string[]; comment?: string; leadTagId?: string | null },
): Promise<LeadItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<LeadItem>(res)
}

export async function deleteLead(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

export type BulkDeleteLeadsResult = { deleted: number }

export async function bulkDeleteLeads(leadIds: string[]): Promise<BulkDeleteLeadsResult> {
  const res = await authenticatedFetch(`${API_BASE}/leads/bulk-delete`, {
    method: 'POST',
    body: JSON.stringify({ leadIds }),
  })
  return parseResponse<BulkDeleteLeadsResult>(res)
}

export type LeadNoteItem = {
  _id: string
  leadId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
}

export type LeadCommentItem = {
  _id: string
  leadId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string
}

export type LeadHistoryAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assigned'
  | 'note_added'
  | 'note_edited'
  | 'note_deleted'
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'task_added'
  | 'task_updated'
  | 'task_deleted'
  | 'reminder_added'
  | 'reminder_done'
  | 'reminder_deleted'

export type LeadHistoryItem = {
  _id: string
  leadId: string
  action: LeadHistoryAction
  userId: string
  userDisplayName?: string
  meta: Record<string, unknown>
  createdAt: string
}

export async function getLeadNotes(leadId: string): Promise<LeadNoteItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/notes`)
  return parseResponse<LeadNoteItem[]>(res)
}

export async function addLeadNote(leadId: string, content: string): Promise<LeadNoteItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return parseResponse<LeadNoteItem>(res)
}

export async function updateLeadNote(leadId: string, noteId: string, content: string): Promise<LeadNoteItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })
  return parseResponse<LeadNoteItem>(res)
}

export async function deleteLeadNote(leadId: string, noteId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/notes/${noteId}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

export async function getLeadComments(leadId: string): Promise<LeadCommentItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/comments`)
  return parseResponse<LeadCommentItem[]>(res)
}

export async function addLeadComment(leadId: string, content: string): Promise<LeadCommentItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return parseResponse<LeadCommentItem>(res)
}

export async function updateLeadComment(leadId: string, commentId: string, content: string): Promise<LeadCommentItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })
  return parseResponse<LeadCommentItem>(res)
}

export async function deleteLeadComment(leadId: string, commentId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/comments/${commentId}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

export async function getLeadHistory(leadId: string): Promise<LeadHistoryItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/history`)
  return parseResponse<LeadHistoryItem[]>(res)
}

export type LeadTaskItem = {
  _id: string
  leadId: string
  title: string
  dueAt: string | null
  completed: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type LeadReminderItem = {
  _id: string
  leadId: string
  title: string
  remindAt: string
  done: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export async function getLeadTasks(leadId: string): Promise<LeadTaskItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/tasks`)
  return parseResponse<LeadTaskItem[]>(res)
}

export async function addLeadTask(leadId: string, data: { title: string; dueAt?: string | null }): Promise<LeadTaskItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<LeadTaskItem>(res)
}

export async function updateLeadTask(
  leadId: string,
  taskId: string,
  data: { title?: string; dueAt?: string | null; completed?: boolean },
): Promise<LeadTaskItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<LeadTaskItem>(res)
}

export async function deleteLeadTask(leadId: string, taskId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/tasks/${taskId}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

export async function getLeadReminders(leadId: string): Promise<LeadReminderItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/reminders`)
  return parseResponse<LeadReminderItem[]>(res)
}

export async function addLeadReminder(leadId: string, data: { title: string; remindAt: string }): Promise<LeadReminderItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/reminders`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<LeadReminderItem>(res)
}

export async function markLeadReminderDone(leadId: string, reminderId: string): Promise<LeadReminderItem> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/reminders/${reminderId}/done`, { method: 'PATCH' })
  return parseResponse<LeadReminderItem>(res)
}

export async function deleteLeadReminder(leadId: string, reminderId: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/leads/${leadId}/reminders/${reminderId}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

export type UpcomingReminderItem = LeadReminderItem & { leadName?: string }

export async function getUpcomingReminders(): Promise<UpcomingReminderItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/leads/reminders/upcoming`)
  return parseResponse<UpcomingReminderItem[]>(res)
}

export type BulkCreateLeadsResult = {
  added: number
  duplicates: number
}

export async function bulkCreateLeads(
  departmentId: string,
  items: { name: string; phone: string; email?: string }[],
): Promise<BulkCreateLeadsResult> {
  const res = await authenticatedFetch(`${API_BASE}/leads/bulk`, {
    method: 'POST',
    body: JSON.stringify({ departmentId, items }),
  })
  return parseResponse<BulkCreateLeadsResult>(res)
}

export type BulkUpdateLeadsResult = {
  updated: number
}

export async function bulkUpdateLeads(
  leadIds: string[],
  dto: { statusId?: string; assignedTo?: string[]; leadTagId?: string | null },
): Promise<BulkUpdateLeadsResult> {
  const res = await authenticatedFetch(`${API_BASE}/leads/bulk`, {
    method: 'PATCH',
    body: JSON.stringify({ leadIds, ...dto }),
  })
  return parseResponse<BulkUpdateLeadsResult>(res)
}

export type LeadStatsByStatusRow = {
  assigneeId: string
  assigneeName: string
  isManager: boolean
  byStatus: { statusId: string; statusName: string; count: number }[]
  total: number
}

export type LeadStatsResult = {
  departmentId: string
  departmentName: string
  statuses: { _id: string; name: string; order: number }[]
  rows: LeadStatsByStatusRow[]
  filters?: { dateFrom?: string; dateTo?: string; statusId?: string }
}

export async function getLeadStats(
  departmentId: string,
  params?: { dateFrom?: string; dateTo?: string; statusId?: string },
): Promise<LeadStatsResult> {
  const sp = new URLSearchParams()
  sp.set('departmentId', departmentId)
  if (params?.dateFrom?.trim()) sp.set('dateFrom', params.dateFrom.trim())
  if (params?.dateTo?.trim()) sp.set('dateTo', params.dateTo.trim())
  if (params?.statusId?.trim()) sp.set('statusId', params.statusId.trim())
  const res = await authenticatedFetch(`${API_BASE}/leads/stats?${sp}`)
  return parseResponse<LeadStatsResult>(res)
}

export async function getLeadsExport(
  departmentId: string,
  params?: { dateFrom?: string; dateTo?: string; statusId?: string; assignedTo?: string },
): Promise<LeadItem[]> {
  const sp = new URLSearchParams()
  sp.set('departmentId', departmentId)
  if (params?.dateFrom?.trim()) sp.set('dateFrom', params.dateFrom.trim())
  if (params?.dateTo?.trim()) sp.set('dateTo', params.dateTo.trim())
  if (params?.statusId?.trim()) sp.set('statusId', params.statusId.trim())
  if (params?.assignedTo?.trim()) sp.set('assignedTo', params.assignedTo.trim())
  const res = await authenticatedFetch(`${API_BASE}/leads/export?${sp}`)
  return parseResponse<LeadItem[]>(res)
}
