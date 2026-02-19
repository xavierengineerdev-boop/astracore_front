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

export type TaskItem = {
  _id: string
  title: string
  description: string
  departmentId: string
  statusId: string | null
  statusName?: string
  statusColor?: string
  priorityId: string | null
  priorityName?: string
  priorityColor?: string
  assigneeId: string | null
  assigneeName?: string
  dueAt: string | null
  order?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type TaskStatusItem = {
  _id: string
  name: string
  color: string
  order: number
  isCompleted: boolean
  departmentId: string
  createdAt: string
  updatedAt: string
}

// ——— Task priorities (приоритеты по отделам) ———
export type TaskPriorityItem = {
  _id: string
  name: string
  color: string
  order: number
  departmentId: string
  createdAt: string
  updatedAt: string
}

export async function getTaskPriorities(departmentId: string): Promise<TaskPriorityItem[]> {
  const res = await authenticatedFetch(
    `${API_BASE}/task-priorities?departmentId=${encodeURIComponent(departmentId)}`,
  )
  return parseResponse<TaskPriorityItem[]>(res)
}

export async function createTaskPriority(data: {
  name: string
  color?: string
  departmentId: string
}): Promise<TaskPriorityItem> {
  const res = await authenticatedFetch(`${API_BASE}/task-priorities`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<TaskPriorityItem>(res)
}

export async function updateTaskPriority(
  id: string,
  data: { name?: string; color?: string },
): Promise<TaskPriorityItem> {
  const res = await authenticatedFetch(`${API_BASE}/task-priorities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<TaskPriorityItem>(res)
}

export async function deleteTaskPriority(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/task-priorities/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

// ——— Task statuses (колонки по отделам) ———
export async function getTaskStatuses(departmentId: string): Promise<TaskStatusItem[]> {
  const res = await authenticatedFetch(
    `${API_BASE}/task-statuses?departmentId=${encodeURIComponent(departmentId)}`,
  )
  return parseResponse<TaskStatusItem[]>(res)
}

export async function createTaskStatus(data: {
  name: string
  color?: string
  isCompleted?: boolean
  departmentId: string
}): Promise<TaskStatusItem> {
  const res = await authenticatedFetch(`${API_BASE}/task-statuses`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<TaskStatusItem>(res)
}

export async function updateTaskStatus(
  id: string,
  data: { name?: string; color?: string; isCompleted?: boolean },
): Promise<TaskStatusItem> {
  const res = await authenticatedFetch(`${API_BASE}/task-statuses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<TaskStatusItem>(res)
}

export async function deleteTaskStatus(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/task-statuses/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

// ——— Tasks ———
export async function getTasksByDepartment(departmentId: string): Promise<TaskItem[]> {
  const res = await authenticatedFetch(`${API_BASE}/tasks?departmentId=${encodeURIComponent(departmentId)}`)
  return parseResponse<TaskItem[]>(res)
}

export async function getTask(id: string): Promise<TaskItem> {
  const res = await authenticatedFetch(`${API_BASE}/tasks/${id}`)
  return parseResponse<TaskItem>(res)
}

export async function createTask(data: {
  title: string
  description?: string
  departmentId: string
  statusId?: string | null
  priorityId?: string | null
  assigneeId?: string | null
  dueAt?: string | null
}): Promise<TaskItem> {
  const res = await authenticatedFetch(`${API_BASE}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return parseResponse<TaskItem>(res)
}

export async function updateTask(
  id: string,
  data: {
    title?: string
    description?: string
    statusId?: string | null
    priorityId?: string | null
    assigneeId?: string | null
    dueAt?: string | null
  },
): Promise<TaskItem> {
  const res = await authenticatedFetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return parseResponse<TaskItem>(res)
}

export async function deleteTask(id: string): Promise<void> {
  const res = await authenticatedFetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' })
  await parseResponse<{ message: string }>(res)
}

export async function reorderTasks(
  departmentId: string,
  statusId: string | null,
  taskIds: string[],
): Promise<void> {
  const res = await authenticatedFetch(
    `${API_BASE}/tasks/reorder?departmentId=${encodeURIComponent(departmentId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ statusId: statusId ?? '', taskIds }),
    },
  )
  await parseResponse<{ message: string }>(res)
}
