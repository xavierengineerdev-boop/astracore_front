import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
  Checkbox,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import {
  getLead,
  updateLead,
  deleteLead,
  getLeadNotes,
  addLeadNote,
  updateLeadNote,
  deleteLeadNote,
  getLeadHistory,
  getLeadTasks,
  addLeadTask,
  updateLeadTask,
  deleteLeadTask,
  getLeadReminders,
  addLeadReminder,
  markLeadReminderDone,
  deleteLeadReminder,
  type LeadItem,
  type LeadNoteItem,
  type LeadHistoryItem,
  type LeadTaskItem,
  type LeadReminderItem,
} from '@/api/leads'
import { getDepartment, type DepartmentDetail } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'

const formFieldSx = {
  '& .MuiOutlinedInput-root': { minHeight: 48 },
  '& .MuiOutlinedInput-input': { paddingTop: '16px', paddingBottom: '16px', boxSizing: 'border-box' },
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const HISTORY_ACTION_LABELS: Record<string, string> = {
  created: 'Лид создан',
  updated: 'Данные изменены',
  status_changed: 'Статус изменён',
  assigned: 'Назначение изменено',
  note_added: 'Добавлена заметка',
  note_edited: 'Заметка отредактирована',
  note_deleted: 'Заметка удалена',
  task_added: 'Добавлена задача',
  task_updated: 'Задача изменена',
  task_deleted: 'Задача удалена',
  reminder_added: 'Добавлено напоминание',
  reminder_done: 'Напоминание выполнено',
  reminder_deleted: 'Напоминание удалено',
}

const LeadCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [lead, setLead] = useState<LeadItem | null>(null)
  const [department, setDepartment] = useState<DepartmentDetail | null>(null)
  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [editName, setEditName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editStatusId, setEditStatusId] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState<string[]>([])

  const [notes, setNotes] = useState<LeadNoteItem[]>([])
  const [history, setHistory] = useState<LeadHistoryItem[]>([])
  const [noteContent, setNoteContent] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteEditId, setNoteEditId] = useState<string | null>(null)
  const [noteEditContent, setNoteEditContent] = useState('')
  const [noteEditSaving, setNoteEditSaving] = useState(false)
  const [noteDeleteId, setNoteDeleteId] = useState<string | null>(null)
  const [noteDeleting, setNoteDeleting] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [tasks, setTasks] = useState<LeadTaskItem[]>([])
  const [reminders, setReminders] = useState<LeadReminderItem[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueAt, setTaskDueAt] = useState<Dayjs | null>(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderRemindAt, setReminderRemindAt] = useState<Dayjs | null>(null)
  const [reminderSubmitting, setReminderSubmitting] = useState(false)

  const isEmployee = currentUser?.role === 'employee'
  const isManager = currentUser?.role === 'super' || currentUser?.role === 'admin' || currentUser?.role === 'manager'
  const canEditLead = Boolean(
    currentUser &&
      (currentUser.role === 'super' ||
        currentUser.role === 'admin' ||
        currentUser.role === 'manager' ||
        (currentUser.role === 'employee' && lead?.departmentId)),
  )

  const assigneeOptions = useMemo(() => {
    if (!department) return []
    const list: { id: string; label: string }[] = []
    const seen = new Set<string>()
    const add = (u: { _id: string; firstName?: string; lastName?: string; email: string }) => {
      if (seen.has(u._id)) return
      seen.add(u._id)
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
      list.push({ id: u._id, label: name || u.email })
    }
    if (department.manager) add(department.manager)
    ;(department.employees || []).forEach(add)
    return list
  }, [department])

  const assigneeNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    assigneeOptions.forEach((o) => { m[o.id] = o.label })
    return m
  }, [assigneeOptions])

  const displayHistory = useMemo(() => {
    const hasCreated = history.some((e) => e.action === 'created')
    if (!lead?.createdAt || !lead?.createdBy) return history
    if (hasCreated) return history
    return [
      { _id: '_created', action: 'created' as const, userId: lead.createdBy, createdAt: lead.createdAt, meta: { name: lead.name } },
      ...history,
    ]
  }, [history, lead?.createdAt, lead?.createdBy, lead?.name])

  const activityByDay = useMemo(() => {
    const byDay: Record<string, number> = {}
    displayHistory.forEach((entry) => {
      const key = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('ru-RU') : ''
      if (key) byDay[key] = (byDay[key] ?? 0) + 1
    })
    const entries = Object.entries(byDay).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    return entries.slice(-14)
  }, [displayHistory])

  const timeInStatuses = useMemo(() => {
    const statusChanges: { createdAt: string; statusId: string | null }[] = []
    const createdEntry = displayHistory.find((e) => e.action === 'created')
    const firstStatusChange = displayHistory.find((e) => e.action === 'status_changed')
    const initialStatus =
      (createdEntry?.meta as { statusId?: string } | undefined)?.statusId ??
      (firstStatusChange?.meta as { oldStatusId?: string })?.oldStatusId ??
      lead?.statusId ??
      null
    const createdAt = lead?.createdAt || (createdEntry?.createdAt ?? '')
    if (createdAt && initialStatus !== undefined) {
      statusChanges.push({ createdAt, statusId: initialStatus })
    }
    displayHistory
      .filter((e) => e.action === 'status_changed')
      .forEach((e) => {
        const m = e.meta as { newStatusId?: string }
        if (m?.newStatusId !== undefined) statusChanges.push({ createdAt: e.createdAt, statusId: m.newStatusId })
      })
    statusChanges.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const now = Date.now()
    const totals: Record<string, number> = {}
    for (let i = 0; i < statusChanges.length; i++) {
      const from = new Date(statusChanges[i].createdAt).getTime()
      const to = i + 1 < statusChanges.length ? new Date(statusChanges[i + 1].createdAt).getTime() : now
      const sid = statusChanges[i].statusId ?? '_empty'
      totals[sid] = (totals[sid] ?? 0) + (to - from)
    }
    return Object.entries(totals).map(([sid, ms]) => ({
      statusId: sid === '_empty' ? null : sid,
      days: Math.round((ms / (24 * 60 * 60 * 1000)) * 10) / 10,
    }))
  }, [displayHistory, lead?.createdAt, lead?.statusId])

  useEffect(() => {
    if (!id || !currentUser) {
      setLoading(false)
      return
    }
    let cancelled = false
    getLead(id)
      .then((data) => {
        if (cancelled) return undefined
        setLead(data)
        return Promise.all([
          getDepartment(data.departmentId),
          getStatusesByDepartment(data.departmentId),
        ])
      })
      .then((result) => {
        if (cancelled || !result) return
        const [dept, statusList] = result
        if (dept) {
          setDepartment(dept)
          setStatuses(statusList || [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Лид не найден')
          navigate('/leads')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, currentUser, navigate, toast])

  useEffect(() => {
    if (!id || !lead) return
    setLoadingNotes(true)
    setLoadingHistory(true)
    setLoadingTasks(true)
    setLoadingReminders(true)
    getLeadNotes(id).then(setNotes).catch(() => setNotes([])).finally(() => setLoadingNotes(false))
    getLeadHistory(id).then(setHistory).catch(() => setHistory([])).finally(() => setLoadingHistory(false))
    getLeadTasks(id).then(setTasks).catch(() => setTasks([])).finally(() => setLoadingTasks(false))
    getLeadReminders(id).then(setReminders).catch(() => setReminders([])).finally(() => setLoadingReminders(false))
  }, [id, lead?._id])

  const refetchNotesAndHistory = () => {
    if (!id) return
    getLeadNotes(id).then(setNotes).catch(() => setNotes([]))
    getLeadHistory(id).then(setHistory).catch(() => setHistory([]))
  }
  const refetchTasksAndReminders = () => {
    if (!id) return
    getLeadTasks(id).then(setTasks).catch(() => setTasks([]))
    getLeadReminders(id).then(setReminders).catch(() => setReminders([]))
  }
  const refetchHistory = () => {
    if (!id) return
    getLeadHistory(id).then(setHistory).catch(() => setHistory([]))
  }
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !taskTitle.trim()) return
    setTaskSubmitting(true)
    try {
      await addLeadTask(id, { title: taskTitle.trim(), dueAt: taskDueAt ? taskDueAt.toISOString() : undefined })
      setTaskTitle('')
      setTaskDueAt(null)
      toast.success('Задача добавлена')
      refetchTasksAndReminders()
      refetchHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setTaskSubmitting(false)
    }
  }
  const handleToggleTask = async (task: LeadTaskItem) => {
    if (!id) return
    try {
      await updateLeadTask(id, task._id, { completed: !task.completed })
      refetchTasksAndReminders()
      refetchHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }
  const handleDeleteTask = async (taskId: string) => {
    if (!id) return
    try {
      await deleteLeadTask(id, taskId)
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
      toast.success('Задача удалена')
      refetchHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !reminderTitle.trim() || !reminderRemindAt) {
      toast.error('Укажите текст и дату напоминания')
      return
    }
    setReminderSubmitting(true)
    try {
      const remindAt = reminderRemindAt.toISOString()
      await addLeadReminder(id, { title: reminderTitle.trim(), remindAt })
      setReminderTitle('')
      setReminderRemindAt(null)
      toast.success('Напоминание добавлено')
      refetchTasksAndReminders()
      refetchHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setReminderSubmitting(false)
    }
  }
  const handleReminderDone = async (reminder: LeadReminderItem) => {
    if (!id) return
    try {
      await markLeadReminderDone(id, reminder._id)
      setReminders((prev) => prev.filter((r) => r._id !== reminder._id))
      toast.success('Напоминание отмечено')
      refetchHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }
  const handleDeleteReminder = async (reminderId: string) => {
    if (!id) return
    try {
      await deleteLeadReminder(id, reminderId)
      setReminders((prev) => prev.filter((r) => r._id !== reminderId))
      toast.success('Напоминание удалено')
      refetchHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const canEditOrDeleteNote = (note: LeadNoteItem) =>
    isManager || String(note.authorId) === String(currentUser?.userId)

  const startEdit = () => {
    if (!lead) return
    setEditName(lead.name)
    setEditLastName(lead.lastName ?? '')
    setEditPhone(lead.phone ?? '')
    setEditEmail(lead.email ?? '')
    setEditStatusId(lead.statusId ?? '')
    setEditAssignedTo(lead.assignedTo ?? [])
    setEditing(true)
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteContent.trim()) return
    setNoteSubmitting(true)
    try {
      await addLeadNote(id, noteContent.trim())
      setNoteContent('')
      toast.success('Заметка добавлена')
      refetchNotesAndHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setNoteSubmitting(false)
    }
  }

  const openNoteEdit = (note: LeadNoteItem) => {
    setNoteEditId(note._id)
    setNoteEditContent(note.content)
  }
  const handleSaveNoteEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteEditId || !noteEditContent.trim()) return
    setNoteEditSaving(true)
    try {
      await updateLeadNote(id, noteEditId, noteEditContent.trim())
      setNoteEditId(null)
      toast.success('Заметка сохранена')
      refetchNotesAndHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setNoteEditSaving(false)
    }
  }
  const handleDeleteNoteConfirm = async () => {
    if (!id || !noteDeleteId) return
    setNoteDeleting(true)
    try {
      await deleteLeadNote(id, noteDeleteId)
      setNoteDeleteId(null)
      toast.success('Заметка удалена')
      refetchNotesAndHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setNoteDeleting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !lead) return
    if (isEmployee && editAssignedTo.length > 0 && (editAssignedTo.length !== 1 || editAssignedTo[0] !== currentUser?.userId)) {
      toast.error('Сотрудник может только взять лид на себя')
      return
    }
    setSaving(true)
    try {
      const updated = await updateLead(id, {
        name: editName.trim(),
        lastName: editLastName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        statusId: editStatusId || undefined,
        assignedTo: editAssignedTo,
      })
      setLead(updated)
      setEditing(false)
      toast.success('Лид обновлён')
      refetchNotesAndHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => setDeleteConfirmOpen(true)
  const handleDeleteConfirm = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteLead(id)
      toast.success('Лид удалён')
      navigate('/leads')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  const backUrl = '/leads' + (lead?.departmentId ? `?departmentId=${lead.departmentId}` : '')

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
      </Box>
    )
  }

  if (!lead) return null

  const statusItem = statuses.find((s) => s._id === lead.statusId)
  const assignedNames = (lead.assignedTo ?? []).map((id) => assigneeNameMap[id] || id).filter(Boolean).join(', ') || '—'

  return (
    <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backUrl)}
          sx={{ color: 'rgba(196,181,253,0.9)' }}
        >
          К списку лидов
        </Button>
        {canEditLead && (
          <>
            <Tooltip title="Редактировать">
              <IconButton onClick={startEdit} sx={{ color: 'rgba(167,139,250,0.9)' }} size="medium">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton onClick={handleDeleteClick} sx={{ color: 'rgba(248,113,113,0.9)' }} size="medium">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
        Карточка лида
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'stretch' }}>
        <Paper
          sx={{
            p: 3,
            flex: { md: 1 },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
        <Box sx={{ display: 'grid', gap: 2, flex: 1, minHeight: 0 }}>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Имя</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)' }}>{lead.name}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Фамилия</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)' }}>{lead.lastName || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Телефон</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{lead.phone || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Email</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{lead.email || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Статус</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {statusItem ? (
                <>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: statusItem.color || '#9ca3af', flexShrink: 0 }} />
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{statusItem.name}</Typography>
                </>
              ) : (
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>—</Typography>
              )}
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Обрабатывает</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{assignedNames}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Отдел</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{department?.name ?? '—'}</Typography>
          </Box>
          {lead.source ? (
            <Box>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">Источник</Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>{lead.source}</Typography>
            </Box>
          ) : null}
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Создан</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>{formatDateTime(lead.createdAt)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Обновлён</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>{formatDateTime(lead.updatedAt)}</Typography>
          </Box>
        </Box>
        </Paper>

        {/* Заметки — второй столбец */}
        <Paper
          sx={{
            p: 3,
            flex: { md: 1 },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 2, fontFamily: '"Orbitron", sans-serif', flexShrink: 0 }}>
          Заметки
        </Typography>
        <Box component="form" onSubmit={handleAddNote} sx={{ mb: 2, flexShrink: 0 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Добавить заметку..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            disabled={noteSubmitting}
            sx={{
              ...formFieldSx,
              '& .MuiOutlinedInput-root': { minHeight: 72 },
            }}
          />
          <Button
            type="submit"
            size="small"
            startIcon={<NoteAddIcon />}
            disabled={noteSubmitting || !noteContent.trim()}
            sx={{ mt: 1, color: 'rgba(167,139,250,0.95)' }}
          >
            {noteSubmitting ? 'Добавление…' : 'Добавить заметку'}
          </Button>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {loadingNotes ? (
          <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
          </Box>
        ) : notes.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет заметок</Typography>
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              pr: 0.5,
            }}
          >
            {notes.map((note) => (
              <Box
                key={note._id}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                      }}
                    >
                      {note.content}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5, display: 'block' }}>
                      {assigneeNameMap[note.authorId] || note.authorId} · {formatDateTime(note.createdAt)}
                    </Typography>
                  </Box>
                  {canEditOrDeleteNote(note) && (
                    <Box sx={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                      <IconButton size="small" onClick={() => openNoteEdit(note)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setNoteDeleteId(note._id)} sx={{ color: 'rgba(248,113,113,0.9)' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
        </Box>
        </Paper>

        {/* Дополнительная информация (с сайта: IP, метаданные, железо) */}
        <Paper
          sx={{
            p: 3,
            flex: { md: 1 },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 2, fontFamily: '"Orbitron", sans-serif', flexShrink: 0 }}>
            Дополнительная информация
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {(() => {
            const sm = lead.sourceMeta
            const rows: { label: string; value: string | undefined }[] = [
              { label: 'IP', value: sm?.ip },
              { label: 'User-Agent', value: sm?.userAgent },
              { label: 'Referrer', value: sm?.referrer },
              { label: 'Экран', value: sm?.screen },
              { label: 'Язык', value: sm?.language },
              { label: 'Платформа', value: sm?.platform },
              { label: 'Часовой пояс', value: sm?.timezone },
              { label: 'Память (GB)', value: sm?.deviceMemory },
              { label: 'Ядра CPU', value: sm?.hardwareConcurrency },
            ]
            if (sm?.extra && typeof sm.extra === 'object') {
              Object.entries(sm.extra).forEach(([k, v]) => {
                rows.push({ label: k, value: v != null ? String(v) : undefined })
              })
            }
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {rows.map((r, idx) => (
                  <Box key={`${r.label}-${idx}`}>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">{r.label}</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: r.value ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {r.value?.trim() || '—'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )
          })()}
          </Box>
        </Paper>
      </Box>

      {/* Блоки перед историей: активность, время в статусах, задачи, напоминания — компактная высота как у заметок */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3, alignItems: 'stretch' }}>
        <Paper
          sx={{
            p: 2.5,
            flex: '1 1 280px',
            minWidth: 0,
            maxWidth: { md: 400 },
            maxHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
            Активность по дням
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {activityByDay.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет данных</Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 0.75,
                height: 100,
                px: 0.5,
                py: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {activityByDay.map(([day, count]) => {
                const maxCount = Math.max(...activityByDay.map(([, c]) => c), 1)
                const h = Math.max(12, (count / maxCount) * 100)
                return (
                  <Tooltip key={day} title={`${day}: ${count} ${count === 1 ? 'событие' : 'события'}`}>
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 28,
                          height: `${h}%`,
                          minHeight: 8,
                          borderRadius: '6px 6px 0 0',
                          background: 'linear-gradient(180deg, rgba(167,139,250,0.95) 0%, rgba(139,92,246,0.75) 100%)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'height 0.2s ease',
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
                        {day}
                      </Typography>
                    </Box>
                  </Tooltip>
                )
              })}
            </Box>
          )}
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            flex: '1 1 280px',
            minWidth: 0,
            maxWidth: { md: 400 },
            maxHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
            Время в статусах
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {timeInStatuses.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет данных</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {timeInStatuses.map(({ statusId, days }) => {
                const status = statusId ? statuses.find((s) => s._id === statusId) : null
                const totalDays = timeInStatuses.reduce((s, t) => s + t.days, 0)
                const pct = totalDays > 0 ? (days / totalDays) * 100 : 0
                const barColor = status?.color || '#a78bfa'
                return (
                  <Box key={statusId ?? 'null'}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>
                        {status?.name ?? (statusId ? '—' : 'Без статуса')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                        {days} дн.
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 10,
                        borderRadius: '10px',
                        bgcolor: 'rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: '10px',
                          bgcolor: barColor,
                          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            flex: '1 1 280px',
            minWidth: 0,
            maxWidth: { md: 400 },
            maxHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
            Задачи
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Box component="form" onSubmit={handleAddTask} sx={{ mb: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Название задачи"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              disabled={taskSubmitting}
              sx={{ mb: 1, ...formFieldSx }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
              <DateTimePicker
                label="Дедлайн"
                value={taskDueAt}
                onChange={(v) => setTaskDueAt(v)}
                disabled={taskSubmitting}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: { mb: 1, ...formFieldSx },
                  },
                }}
              />
            </LocalizationProvider>
            <Button
              type="submit"
              size="small"
              startIcon={<TaskAltIcon />}
              disabled={taskSubmitting || !taskTitle.trim()}
              sx={{ color: 'rgba(167,139,250,0.95)' }}
            >
              {taskSubmitting ? 'Добавление…' : 'Добавить задачу'}
            </Button>
          </Box>
          {loadingTasks ? (
            <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} sx={{ color: 'rgba(167,139,250,0.8)' }} />
            </Box>
          ) : tasks.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет задач</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {tasks.map((task) => (
                <Box
                  key={task._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task)}
                    sx={{ color: 'rgba(167,139,250,0.7)', p: 0.25, '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: task.completed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)',
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </Typography>
                    {task.dueAt && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                        {formatDateTime(task.dueAt)}
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small" onClick={() => handleDeleteTask(task._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            flex: '1 1 280px',
            minWidth: 0,
            maxWidth: { md: 400 },
            maxHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
            Напоминания
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Box component="form" onSubmit={handleAddReminder} sx={{ mb: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Например: перезвонить"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              disabled={reminderSubmitting}
              sx={{ mb: 1, ...formFieldSx }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
              <DateTimePicker
                label="Дата и время"
                value={reminderRemindAt}
                onChange={(v) => setReminderRemindAt(v)}
                disabled={reminderSubmitting}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: { mb: 1, ...formFieldSx },
                  },
                }}
              />
            </LocalizationProvider>
            <Button
              type="submit"
              size="small"
              startIcon={<NotificationsActiveIcon />}
              disabled={reminderSubmitting || !reminderTitle.trim() || !reminderRemindAt}
              sx={{ color: 'rgba(167,139,250,0.95)' }}
            >
              {reminderSubmitting ? 'Добавление…' : 'Добавить напоминание'}
            </Button>
          </Box>
          {loadingReminders ? (
            <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} sx={{ color: 'rgba(167,139,250,0.8)' }} />
            </Box>
          ) : reminders.filter((r) => !r.done).length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет активных напоминаний</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {reminders
                .filter((r) => !r.done)
                .map((reminder) => (
                  <Box
                    key={reminder._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      bgcolor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        {reminder.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {formatDateTime(reminder.remindAt)}
                      </Typography>
                    </Box>
                    <Tooltip title="Отметить выполненным">
                      <IconButton size="small" onClick={() => handleReminderDone(reminder)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                        <TaskAltIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => handleDeleteReminder(reminder._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
            </Box>
          )}
          </Box>
        </Paper>
      </Box>

      {/* История лида — на всю ширину под карточкой и заметками */}
      <Paper
        sx={{
          p: 3,
          mt: 3,
          width: '100%',
          boxSizing: 'border-box',
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 2, fontFamily: '"Orbitron", sans-serif' }}>
          История лида
        </Typography>
        {loadingHistory ? (
          <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
          </Box>
        ) : (() => {
          if (displayHistory.length === 0) {
            return <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет записей</Typography>
          }
          const historyScrollable = displayHistory.length > 5
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                ...(historyScrollable && { maxHeight: 420, overflowY: 'auto', pr: 0.5 }),
              }}
            >
              {displayHistory.map((entry) => {
                const statusName = (sid: string | null) => (sid ? statuses.find((s) => s._id === sid)?.name ?? sid : '—')
                let detail = ''
                if (entry.action === 'status_changed' && entry.meta) {
                  const m = entry.meta as { oldStatusId?: string; newStatusId?: string }
                  detail = `${statusName(m.oldStatusId ?? null)} → ${statusName(m.newStatusId ?? null)}`
                }
                if (entry.action === 'assigned' && entry.meta) {
                  const m = entry.meta as { oldAssignedTo?: string[]; newAssignedTo?: string[] }
                  const oldNames = (m.oldAssignedTo ?? []).map((id) => assigneeNameMap[id] || id).join(', ') || '—'
                  const newNames = (m.newAssignedTo ?? []).map((id) => assigneeNameMap[id] || id).join(', ') || '—'
                  detail = `${oldNames} → ${newNames}`
                }
                if (entry.action === 'created' && entry.meta) {
                  const m = entry.meta as { name?: string }
                  if (m.name) detail = m.name
                }
                if (entry.action === 'updated' && entry.meta) {
                  const m = entry.meta as Record<string, unknown>
                  const parts = Object.entries(m)
                    .filter(([, v]) => v != null && v !== '')
                    .map(([k, v]) => {
                      const labels: Record<string, string> = { name: 'Имя', lastName: 'Фамилия', phone: 'Телефон', email: 'Email' }
                      return `${labels[k] ?? k}: ${String(v)}`
                    })
                  if (parts.length) detail = parts.join(' · ')
                }
                if ((entry.action === 'note_added' || entry.action === 'note_edited') && entry.meta) {
                  const m = entry.meta as { content?: string }
                  if (m.content) detail = m.content
                }
                if ((entry.action === 'task_added' || entry.action === 'task_updated' || entry.action === 'task_deleted') && entry.meta) {
                  const m = entry.meta as { title?: string; dueAt?: string | null; completed?: boolean }
                  const parts: string[] = []
                  if (m.title) parts.push(m.title)
                  if (m.dueAt) parts.push(`до ${formatDateTime(m.dueAt)}`)
                  if (entry.action === 'task_updated' && m.completed !== undefined) parts.push(m.completed ? 'выполнена' : 'в работе')
                  if (parts.length) detail = parts.join(' · ')
                }
                if ((entry.action === 'reminder_added' || entry.action === 'reminder_done' || entry.action === 'reminder_deleted') && entry.meta) {
                  const m = entry.meta as { title?: string; remindAt?: string }
                  const parts: string[] = []
                  if (m.title) parts.push(m.title)
                  if (m.remindAt) parts.push(formatDateTime(m.remindAt))
                  if (parts.length) detail = parts.join(' · ')
                }
                return (
                  <Box
                    key={entry._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      py: 1.5,
                      px: 2,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(167,139,250,0.9)', flexShrink: 0, mt: 0.75 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                        {HISTORY_ACTION_LABELS[entry.action] ?? entry.action}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', mt: 0.25 }}>
                        {(entry as LeadHistoryItem).userDisplayName || assigneeNameMap[entry.userId] || entry.userId} · {formatDateTime(entry.createdAt)}
                      </Typography>
                      {detail && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255,255,255,0.65)',
                            display: 'block',
                            mt: 0.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {detail}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )
        })()}
      </Paper>

      <Dialog
        open={editing}
        onClose={() => !saving && setEditing(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Редактировать лид</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              required
              fullWidth
              label="Имя"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              fullWidth
              label="Фамилия"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              fullWidth
              label="Телефон"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              select
              fullWidth
              label="Статус"
              value={editStatusId}
              onChange={(e) => setEditStatusId(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            >
              <MenuItem value="">— Не выбран</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color || '#9ca3af', flexShrink: 0 }} />
                    {s.name}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            {assigneeOptions.length > 0 && (
              isEmployee ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Обрабатывает</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                    {editAssignedTo?.length ? editAssignedTo.map((id) => assigneeNameMap[id] || id).join(', ') : '— Никого'}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setEditAssignedTo(currentUser?.userId ? [currentUser.userId] : [])}
                    sx={{ mt: 1, borderColor: 'rgba(167,139,250,0.5)', color: 'rgba(167,139,250,0.95)' }}
                  >
                    Взять на себя
                  </Button>
                </Box>
              ) : (
                <TextField
                  select
                  SelectProps={{
                    multiple: true,
                    sx: { color: 'rgba(255,255,255,0.95)' },
                    renderValue: (selected: unknown) =>
                      (selected as string[]).length
                        ? (selected as string[]).map((id) => assigneeNameMap[id] || id).join(', ')
                        : '— Никого',
                  }}
                  label="Обрабатывает"
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(Array.isArray(e.target.value) ? e.target.value : [])}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2, ...formFieldSx }}
                >
                  {assigneeOptions.map((o) => (
                    <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                  ))}
                </TextField>
              )
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditing(false)} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить лид?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {lead.name} — действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting}
            sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}
          >
            {deleting ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(noteEditId)}
        onClose={() => !noteEditSaving && setNoteEditId(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Редактировать заметку</DialogTitle>
        <Box component="form" onSubmit={handleSaveNoteEdit}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Текст"
              value={noteEditContent}
              onChange={(e) => setNoteEditContent(e.target.value)}
              required
              sx={formFieldSx}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setNoteEditId(null)} disabled={noteEditSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={noteEditSaving || !noteEditContent.trim()}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {noteEditSaving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(noteDeleteId)}
        onClose={() => !noteDeleting && setNoteDeleteId(null)}
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить заметку?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Действие нельзя отменить.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoteDeleteId(null)} disabled={noteDeleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteNoteConfirm}
            disabled={noteDeleting}
            sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}
          >
            {noteDeleting ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeadCardPage
