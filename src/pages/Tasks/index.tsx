import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tabs,
  Tab,
  alpha,
  Drawer,
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import AssignmentIcon from '@mui/icons-material/Assignment'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import DashboardIcon from '@mui/icons-material/Dashboard'
import FlagIcon from '@mui/icons-material/Flag'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs, { type Dayjs } from 'dayjs'
import { useNavigate } from 'react-router-dom'
import BackButton from '@/components/BackButton'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getDepartments } from '@/api/departments'
import { getDepartment, type DepartmentDetail, type UserItemBrief } from '@/api/departments'
import {
  getTasksByDepartment,
  getTaskStatuses,
  getTaskPriorities,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  createTaskStatus,
  updateTaskStatus,
  deleteTaskStatus,
  createTaskPriority,
  updateTaskPriority,
  deleteTaskPriority,
  type TaskItem,
  type TaskStatusItem,
  type TaskPriorityItem,
} from '@/api/tasks'

function formatDue(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: d.getHours() || d.getMinutes() ? '2-digit' : undefined,
    minute: d.getMinutes() ? '2-digit' : undefined,
  })
}

function displayUser(u: UserItemBrief): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return name || u.email
}

export default function TasksPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([])
  const [departmentId, setDepartmentId] = useState<string>('')
  const [departmentDetail, setDepartmentDetail] = useState<DepartmentDetail | null>(null)
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusItem[]>([])
  const [taskPriorities, setTaskPriorities] = useState<TaskPriorityItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [cardMenuAnchor, setCardMenuAnchor] = useState<null | HTMLElement>(null)
  const [cardMenuTask, setCardMenuTask] = useState<TaskItem | null>(null)
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<TaskItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusEditId, setStatusEditId] = useState<string | null>(null)
  const [statusFormName, setStatusFormName] = useState('')
  const [statusFormColor, setStatusFormColor] = useState('#9ca3af')
  const [statusFormIsCompleted, setStatusFormIsCompleted] = useState(false)
  const [statusSubmitting, setStatusSubmitting] = useState(false)
  const [deleteStatusConfirm, setDeleteStatusConfirm] = useState<TaskStatusItem | null>(null)
  const [deleteStatusSubmitting, setDeleteStatusSubmitting] = useState(false)
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false)
  const [priorityEditId, setPriorityEditId] = useState<string | null>(null)
  const [priorityFormName, setPriorityFormName] = useState('')
  const [priorityFormColor, setPriorityFormColor] = useState('#9ca3af')
  const [prioritySubmitting, setPrioritySubmitting] = useState(false)
  const [deletePriorityConfirm, setDeletePriorityConfirm] = useState<TaskPriorityItem | null>(null)
  const [deletePrioritySubmitting, setDeletePrioritySubmitting] = useState(false)
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const [columnMenuStatus, setColumnMenuStatus] = useState<TaskStatusItem | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [editPanelOpen, setEditPanelOpen] = useState(false)
  const [editPanelTask, setEditPanelTask] = useState<TaskItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriorityId, setEditPriorityId] = useState('')
  const [editAssigneeId, setEditAssigneeId] = useState('')
  const [editDueAt, setEditDueAt] = useState<Dayjs | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const isSuper = user?.role === 'super'

  useEffect(() => {
    if (!isSuper) {
      navigate('/', { replace: true })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await getDepartments()
        if (!cancelled) setDepartments(list)
      } catch (e) {
        if (!cancelled) toast.error(String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isSuper, navigate, toast])

  useEffect(() => {
    const id = departmentId?.trim()
    if (!id || id === 'undefined') {
      setTasks([])
      setTaskStatuses([])
      setTaskPriorities([])
      setDepartmentDetail(null)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [taskList, statusList, priorityList, detail] = await Promise.all([
          getTasksByDepartment(id),
          getTaskStatuses(id),
          getTaskPriorities(id),
          getDepartment(id),
        ])
        if (!cancelled) {
          setTasks(taskList)
          setTaskStatuses(statusList)
          setTaskPriorities(priorityList)
          setDepartmentDetail(detail)
        }
      } catch (e) {
        if (!cancelled) toast.error(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [departmentId, toast])

  const tasksByColumn = useMemo(() => {
    const byKey: Record<string, TaskItem[]> = {}
    for (const s of taskStatuses) byKey[s._id] = []
    byKey['none'] = []
    const statusIds = new Set(taskStatuses.map((s) => s._id))
    for (const t of tasks) {
      const key = t.statusId && statusIds.has(t.statusId) ? t.statusId : 'none'
      byKey[key].push(t)
    }
    return byKey
  }, [tasks, taskStatuses])

  const handleCreateOpen = () => {
    setCreateTitle('')
    setCreateOpen(true)
  }

  const handleCreateSubmit = async () => {
    if (!createTitle.trim() || !departmentId) return
    setCreateSubmitting(true)
    try {
      // Первый блок отдела (например «Новые задачи») — чтобы задача сразу отображалась на доске
      const firstBlockId = taskStatuses[0]?._id ?? null
      const created = await createTask({
        title: createTitle.trim(),
        departmentId,
        statusId: firstBlockId,
      })
      setTasks((prev) => [...prev, created])
      setCreateOpen(false)
      toast.success('Задача создана')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleStatusChange = async (task: TaskItem, newStatusId: string) => {
    setCardMenuAnchor(null)
    setCardMenuTask(null)
    try {
      const updated = await updateTask(task._id, { statusId: newStatusId })
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
      toast.success('Блок обновлён')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    e.dataTransfer.setData('text/plain', task._id)
    e.dataTransfer.effectAllowed = 'move'
    setDragTaskId(task._id)
  }

  const handleDragEnd = () => {
    setDragTaskId(null)
    setDragOverColumnId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    setDragOverColumnId(null)
    setDragTaskId(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return
    const task = tasks.find((t) => t._id === taskId)
    if (!task) return
    const newStatusId = targetColumnId === 'none' ? null : targetColumnId
    const currentCol = task.statusId ?? 'none'
    if (currentCol === (newStatusId ?? 'none')) return
    if (newStatusId && !taskStatuses.some((s) => s._id === newStatusId)) return
    try {
      const updated = await updateTask(taskId, { statusId: newStatusId })
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
      toast.success('Задача перенесена')
    } catch (err) {
      toast.error(String(err))
    }
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumnId(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumnId(null)
  }

  const handleDropOnCard = async (
    e: React.DragEvent,
    targetColumnId: string,
    _targetTask: TaskItem,
    targetIndex: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverColumnId(null)
    setDragTaskId(null)
    const draggedTaskId = e.dataTransfer.getData('text/plain')
    if (!draggedTaskId || !departmentId) return
    const draggedTask = tasks.find((t) => t._id === draggedTaskId)
    if (!draggedTask) return
    const columnTaskIds = (tasksByColumn[targetColumnId] ?? []).map((t) => t._id)
    const statusIdForApi = targetColumnId === 'none' ? null : targetColumnId
    const currentCol = draggedTask.statusId ?? 'none'
    try {
      if (currentCol === targetColumnId) {
        const without = columnTaskIds.filter((id) => id !== draggedTaskId)
        const newOrder = [...without.slice(0, targetIndex), draggedTaskId, ...without.slice(targetIndex)]
        await reorderTasks(departmentId, statusIdForApi, newOrder)
        toast.success('Порядок изменён')
      } else {
        await updateTask(draggedTaskId, {
          statusId: targetColumnId === 'none' ? null : targetColumnId,
        })
        const newOrder = [
          ...columnTaskIds.slice(0, targetIndex),
          draggedTaskId,
          ...columnTaskIds.slice(targetIndex),
        ]
        await reorderTasks(departmentId, statusIdForApi, newOrder)
        toast.success('Задача перенесена')
      }
      const list = await getTasksByDepartment(departmentId)
      setTasks(list)
    } catch (err) {
      toast.error(String(err))
    }
  }

  const openStatusDialog = (editItem?: TaskStatusItem) => {
    if (editItem) {
      setStatusEditId(editItem._id)
      setStatusFormName(editItem.name)
      setStatusFormColor(editItem.color)
      setStatusFormIsCompleted(editItem.isCompleted)
    } else {
      setStatusEditId(null)
      setStatusFormName('')
      setStatusFormColor('#9ca3af')
      setStatusFormIsCompleted(false)
    }
    setStatusDialogOpen(true)
  }

  const handleStatusDialogSubmit = async () => {
    if (!statusFormName.trim()) {
      toast.error('Введите название блока')
      return
    }
    if (!statusEditId && !departmentId?.trim()) {
      toast.error('Выберите отдел')
      return
    }
    setStatusSubmitting(true)
    try {
      if (statusEditId) {
        const updated = await updateTaskStatus(statusEditId, {
          name: statusFormName.trim(),
          color: statusFormColor,
          isCompleted: statusFormIsCompleted,
        })
        setTaskStatuses((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))
        toast.success('Блок обновлён')
      } else {
        const created = await createTaskStatus({
          name: statusFormName.trim(),
          color: statusFormColor,
          isCompleted: statusFormIsCompleted,
          departmentId: departmentId!.trim(),
        })
        setTaskStatuses((prev) => [...prev, created].sort((a, b) => a.order - b.order))
        toast.success('Блок добавлен')
      }
      setStatusDialogOpen(false)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setStatusSubmitting(false)
    }
  }

  const handleDeleteStatusConfirm = async () => {
    const item = deleteStatusConfirm
    if (!item) return
    setDeleteStatusSubmitting(true)
    try {
      await deleteTaskStatus(item._id)
      setTaskStatuses((prev) => prev.filter((s) => s._id !== item._id))
      setDeleteStatusConfirm(null)
      toast.success('Блок удалён')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleteStatusSubmitting(false)
    }
  }

  const openPriorityDialog = (editItem?: TaskPriorityItem) => {
    if (editItem) {
      setPriorityEditId(editItem._id)
      setPriorityFormName(editItem.name)
      setPriorityFormColor(editItem.color)
    } else {
      setPriorityEditId(null)
      setPriorityFormName('')
      setPriorityFormColor('#9ca3af')
    }
    setPriorityDialogOpen(true)
  }

  const handlePriorityDialogSubmit = async () => {
    if (!priorityFormName.trim()) {
      toast.error('Введите название приоритета')
      return
    }
    if (!priorityEditId && !departmentId?.trim()) {
      toast.error('Выберите отдел')
      return
    }
    setPrioritySubmitting(true)
    try {
      if (priorityEditId) {
        const updated = await updateTaskPriority(priorityEditId, {
          name: priorityFormName.trim(),
          color: priorityFormColor,
        })
        setTaskPriorities((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
        toast.success('Приоритет обновлён')
      } else {
        const created = await createTaskPriority({
          name: priorityFormName.trim(),
          color: priorityFormColor,
          departmentId: departmentId!.trim(),
        })
        setTaskPriorities((prev) => [...prev, created].sort((a, b) => a.order - b.order))
        toast.success('Приоритет добавлен')
      }
      setPriorityDialogOpen(false)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setPrioritySubmitting(false)
    }
  }

  const handleDeletePriorityConfirm = async () => {
    const item = deletePriorityConfirm
    if (!item) return
    setDeletePrioritySubmitting(true)
    try {
      await deleteTaskPriority(item._id)
      setTaskPriorities((prev) => prev.filter((p) => p._id !== item._id))
      setDeletePriorityConfirm(null)
      toast.success('Приоритет удалён')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeletePrioritySubmitting(false)
    }
  }

  const handlePriorityChange = async (task: TaskItem, priorityId: string) => {
    setCardMenuAnchor(null)
    setCardMenuTask(null)
    try {
      const updated = await updateTask(task._id, { priorityId })
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
      toast.success('Приоритет обновлён')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const openEditPanel = (task: TaskItem) => {
    setCardMenuAnchor(null)
    setCardMenuTask(null)
    setEditPanelTask(task)
    setEditTitle(task.title)
    setEditPriorityId(task.priorityId ?? '')
    setEditAssigneeId(task.assigneeId ?? '')
    setEditDueAt(task.dueAt ? dayjs(task.dueAt) : null)
    setEditPanelOpen(true)
  }

  const handleEditPanelSave = async () => {
    if (!editPanelTask) return
    setEditSubmitting(true)
    try {
      const updated = await updateTask(editPanelTask._id, {
        title: editTitle.trim(),
        priorityId: editPriorityId || null,
        assigneeId: editAssigneeId || null,
        dueAt: editDueAt ? editDueAt.toISOString() : null,
      })
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
      setEditPanelTask(updated)
      toast.success('Задача обновлена')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    const task = deleteConfirmTask
    if (!task) return
    setDeleteSubmitting(true)
    try {
      await deleteTask(task._id)
      setTasks((prev) => prev.filter((t) => t._id !== task._id))
      setDeleteConfirmTask(null)
      toast.success('Задача удалена')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const employeesForAssign: UserItemBrief[] = useMemo(() => {
    if (!departmentDetail?.employees) return []
    return departmentDetail.employees
  }, [departmentDetail])

  if (!isSuper) return null

  return (
    <Box sx={{ p: 2, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <BackButton fallbackTo="/" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h5">Задачник</Typography>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<DashboardIcon />} iconPosition="start" label="Доска" />
        <Tab icon={<ViewColumnIcon />} iconPosition="start" label="Блоки" />
        <Tab icon={<FlagIcon />} iconPosition="start" label="Приоритеты" />
      </Tabs>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Отдел</InputLabel>
          <Select
            value={departmentId}
            label="Отдел"
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <MenuItem value="">Выберите отдел</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {activeTab === 0 && departmentId && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen}>
            Новая задача
          </Button>
        )}
        {activeTab === 1 && departmentId && (
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openStatusDialog()}>
            Добавить блок
          </Button>
        )}
        {activeTab === 2 && departmentId && (
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openPriorityDialog()}>
            Добавить приоритет
          </Button>
        )}
      </Box>

      {activeTab === 1 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Блоки (колонки) для выбранного отдела. Создавайте блоки — по ним появятся колонки на доске.
          </Typography>
          {!departmentId ? (
            <Typography color="text.secondary">Выберите отдел выше.</Typography>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {taskStatuses.map((s) => (
                <Chip
                  key={s._id}
                  label={s.name}
                  size="medium"
                  sx={{ bgcolor: alpha(s.color, 0.2), borderColor: s.color, border: '1px solid' }}
                  onDelete={() => setDeleteStatusConfirm(s)}
                  onClick={() => openStatusDialog(s)}
                />
              ))}
              {taskStatuses.length === 0 && (
                <Typography color="text.secondary">Нет блоков. Нажмите «Добавить блок».</Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Приоритеты для выбранного отдела. Создавайте приоритеты — их можно назначать задачам при создании и в меню карточки.
          </Typography>
          {!departmentId ? (
            <Typography color="text.secondary">Выберите отдел выше.</Typography>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {taskPriorities.map((p) => (
                <Chip
                  key={p._id}
                  label={p.name}
                  size="medium"
                  sx={{ bgcolor: alpha(p.color, 0.2), borderColor: p.color, border: '1px solid' }}
                  onDelete={() => setDeletePriorityConfirm(p)}
                  onClick={() => openPriorityDialog(p)}
                />
              ))}
              {taskPriorities.length === 0 && (
                <Typography color="text.secondary">Нет приоритетов. Нажмите «Добавить приоритет».</Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 0 && loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {activeTab === 0 && !loading && departmentId && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
          }}
        >
          {[
            ...taskStatuses.map((s) => ({ id: s._id, label: s.name, color: s.color, status: s })),
            ...(tasksByColumn['none']?.length
              ? [{ id: 'none', label: 'Без блока', color: '#6b7280', status: null }]
              : []),
          ].map((col) => {
            const colKey = col.id
            const label = col.label
            const color = col.color
            const columnStatus = col.status as TaskStatusItem | null
            const columnTasks = tasksByColumn[colKey] ?? []
            return (
              <Paper
                key={colKey}
                sx={{
                  minWidth: 280,
                  maxWidth: 280,
                  bgcolor: alpha(color, 0.08),
                  border: `1px solid ${alpha(color, 0.3)}`,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${alpha(color, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip label={columnTasks.length} size="small" />
                    {columnStatus && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setColumnMenuStatus(columnStatus)
                          setColumnMenuAnchor(e.currentTarget)
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Box
                  sx={{
                    overflow: 'auto',
                    p: 1.5,
                    minHeight: 80,
                    borderRadius: 1,
                    bgcolor: dragOverColumnId === colKey ? alpha(color, 0.15) : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onDragOver={(e) => handleDragOver(e, colKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, colKey)}
                >
                  {columnTasks.map((task, index) => (
                    <Paper
                      key={task._id}
                      elevation={0}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverColumnId(colKey)
                      }}
                      onDrop={(e) => handleDropOnCard(e, colKey, task, index)}
                      onClick={() => openEditPanel(task)}
                      sx={{
                        p: 1.75,
                        mb: 1.5,
                        bgcolor: 'background.paper',
                        borderRadius: 1.5,
                        position: 'relative',
                        cursor: 'grab',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease, opacity 0.15s ease',
                        opacity: dragTaskId === task._id ? 0.6 : 1,
                        '&:hover': {
                          boxShadow: 1,
                          borderColor: alpha(color, 0.4),
                          '& .card-menu-btn': { opacity: 1 },
                        },
                        '&:active': { cursor: 'grabbing' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              lineHeight: 1.35,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {task.title}
                          </Typography>
                          {task.description?.trim() && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.35,
                              }}
                            >
                              {task.description.trim()}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          className="card-menu-btn"
                          size="small"
                          sx={{ opacity: 0.6, flexShrink: 0, mt: -0.5, mr: -0.5 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCardMenuTask(task)
                            setCardMenuAnchor(e.currentTarget)
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      {(task.assigneeName || task.priorityName || task.dueAt) && (
                        <Box
                          sx={{
                            mt: 1.25,
                            pt: 1.25,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {task.assigneeName && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block' }}>
                              {task.assigneeName}
                            </Typography>
                          )}
                          {task.priorityName && (
                            <Box sx={{ mt: task.assigneeName ? 0.5 : 0 }}>
                              <Chip
                                size="small"
                                label={task.priorityName}
                                sx={{
                                  height: 22,
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(task.priorityColor ?? '#9ca3af', 0.25),
                                  border: '1px solid',
                                  borderColor: alpha(task.priorityColor ?? '#9ca3af', 0.5),
                                  '& .MuiChip-label': { px: 1 },
                                }}
                              />
                            </Box>
                          )}
                          {task.dueAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: (task.assigneeName || task.priorityName) ? 0.5 : 0 }}>
                              {formatDue(task.dueAt)}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              </Paper>
            )
          })}
          <Paper
            sx={{
              minWidth: 180,
              maxWidth: 180,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'transparent',
            }}
          >
            <Button
              startIcon={<AddIcon />}
onClick={() => openStatusDialog()}
            sx={{ py: 2 }}
            >
              Добавить блок
            </Button>
          </Paper>
        </Box>
      )}

      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor && columnMenuStatus)}
        onClose={() => {
          setColumnMenuAnchor(null)
          setColumnMenuStatus(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {columnMenuStatus && (
          <>
            <MenuItem
              onClick={() => {
                setColumnMenuAnchor(null)
                openStatusDialog(columnMenuStatus)
                setColumnMenuStatus(null)
              }}
            >
              <ListItemText>Редактировать блок</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setColumnMenuAnchor(null)
                setDeleteStatusConfirm(columnMenuStatus)
                setColumnMenuStatus(null)
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <DeleteOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Удалить блок</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {activeTab === 0 && !loading && !departmentId && (
        <Typography color="text.secondary">Выберите отдел, чтобы увидеть задачи.</Typography>
      )}

      <Menu
        anchorEl={cardMenuAnchor}
        open={Boolean(cardMenuAnchor && cardMenuTask)}
        onClose={() => {
          setCardMenuAnchor(null)
          setCardMenuTask(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {cardMenuTask && (
          <MenuItem
            onClick={() => openEditPanel(cardMenuTask)}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Редактировать</ListItemText>
          </MenuItem>
        )}
        {cardMenuTask &&
          taskStatuses
            .filter((s) => s._id !== cardMenuTask.statusId)
            .map((s) => (
              <MenuItem key={s._id} onClick={() => handleStatusChange(cardMenuTask, s._id)}>
                <ListItemIcon>
                  <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: s.color }} />
                </ListItemIcon>
                <ListItemText>В блок: {s.name}</ListItemText>
              </MenuItem>
            ))}
        {cardMenuTask &&
          taskPriorities.map((p) => (
            <MenuItem
              key={p._id}
              onClick={() => handlePriorityChange(cardMenuTask, p._id)}
              disabled={cardMenuTask.priorityId === p._id}
            >
              <ListItemIcon>
                <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: p.color }} />
              </ListItemIcon>
              <ListItemText>Приоритет: {p.name}</ListItemText>
            </MenuItem>
          ))}
        {cardMenuTask && (
          <MenuItem
            onClick={() => {
              setCardMenuAnchor(null)
              setDeleteConfirmTask(cardMenuTask)
              setCardMenuTask(null)
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Удалить</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Drawer
        anchor="right"
        open={editPanelOpen}
        onClose={() => !editSubmitting && setEditPanelOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Редактирование задачи
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {editPanelTask && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Название"
                fullWidth
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              <FormControl fullWidth margin="dense" sx={{ mb: 1.5 }}>
                <InputLabel>Приоритет</InputLabel>
                <Select
                  value={editPriorityId}
                  label="Приоритет"
                  onChange={(e) => setEditPriorityId(e.target.value)}
                >
                  <MenuItem value="">Без приоритета</MenuItem>
                  {taskPriorities.map((p) => (
                    <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense" sx={{ mb: 1.5 }}>
                <InputLabel>Исполнитель</InputLabel>
                <Select
                  value={editAssigneeId}
                  label="Исполнитель"
                  onChange={(e) => setEditAssigneeId(e.target.value)}
                >
                  <MenuItem value="">Не назначен</MenuItem>
                  {employeesForAssign.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {displayUser(u)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                <DateTimePicker
                  label="Срок"
                  value={editDueAt}
                  onChange={(v) => setEditDueAt(v)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'dense',
                      sx: { mb: 2 },
                    },
                  }}
                />
              </LocalizationProvider>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                fullWidth
                onClick={handleEditPanelSave}
                disabled={!editTitle.trim() || editSubmitting}
              >
                {editSubmitting ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      <Dialog open={createOpen} onClose={() => !createSubmitting && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новая задача</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            required
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="Введите название задачи"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createSubmitting}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={!createTitle.trim() || createSubmitting}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteConfirmTask)}
        onClose={() => !deleteSubmitting && setDeleteConfirmTask(null)}
      >
        <DialogTitle>Удалить задачу?</DialogTitle>
        <DialogContent>
          {deleteConfirmTask && (
            <Typography>
              «{deleteConfirmTask.title}» будет удалена без возможности восстановления.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmTask(null)} disabled={deleteSubmitting}>
            Отмена
          </Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={deleteSubmitting}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={statusDialogOpen}
        onClose={() => !statusSubmitting && setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{statusEditId ? 'Редактировать блок' : 'Добавить блок'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            required
            value={statusFormName}
            onChange={(e) => setStatusFormName(e.target.value)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Цвет
            </Typography>
            <input
              type="color"
              value={statusFormColor}
              onChange={(e) => setStatusFormColor(e.target.value)}
              style={{ width: 40, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer' }}
            />
            <TextField
              size="small"
              value={statusFormColor}
              onChange={(e) => setStatusFormColor(e.target.value)}
              sx={{ width: 100 }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <input
              type="checkbox"
              id="status-is-completed"
              checked={statusFormIsCompleted}
              onChange={(e) => setStatusFormIsCompleted(e.target.checked)}
            />
            <Typography component="label" htmlFor="status-is-completed" variant="body2">
              Считается «Выполнено»
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={statusSubmitting}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusDialogSubmit}
            disabled={
              !statusFormName.trim() ||
              statusSubmitting ||
              (!statusEditId && !departmentId?.trim())
            }
          >
            {statusEditId ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteStatusConfirm)}
        onClose={() => !deleteStatusSubmitting && setDeleteStatusConfirm(null)}
      >
        <DialogTitle>Удалить блок?</DialogTitle>
        <DialogContent>
          {deleteStatusConfirm && (
            <Typography>
              Блок «{deleteStatusConfirm.name}» будет удалён. Задачи отобразятся в «Без блока».
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteStatusConfirm(null)} disabled={deleteStatusSubmitting}>
            Отмена
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteStatusConfirm}
            disabled={deleteStatusSubmitting}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={priorityDialogOpen}
        onClose={() => !prioritySubmitting && setPriorityDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{priorityEditId ? 'Редактировать приоритет' : 'Добавить приоритет'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            required
            value={priorityFormName}
            onChange={(e) => setPriorityFormName(e.target.value)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Цвет
            </Typography>
            <input
              type="color"
              value={priorityFormColor}
              onChange={(e) => setPriorityFormColor(e.target.value)}
              style={{ width: 40, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer' }}
            />
            <TextField
              size="small"
              value={priorityFormColor}
              onChange={(e) => setPriorityFormColor(e.target.value)}
              sx={{ width: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriorityDialogOpen(false)} disabled={prioritySubmitting}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handlePriorityDialogSubmit}
            disabled={
              !priorityFormName.trim() ||
              prioritySubmitting ||
              (!priorityEditId && !departmentId?.trim())
            }
          >
            {priorityEditId ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deletePriorityConfirm)}
        onClose={() => !deletePrioritySubmitting && setDeletePriorityConfirm(null)}
      >
        <DialogTitle>Удалить приоритет?</DialogTitle>
        <DialogContent>
          {deletePriorityConfirm && (
            <Typography>
              Приоритет «{deletePriorityConfirm.name}» будет удалён. У задач он сбросится.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePriorityConfirm(null)} disabled={deletePrioritySubmitting}>
            Отмена
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeletePriorityConfirm}
            disabled={deletePrioritySubmitting}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}
