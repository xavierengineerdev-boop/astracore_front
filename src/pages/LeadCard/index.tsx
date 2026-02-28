import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material'
import BackButton from '@/components/BackButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
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
  getLeadComments,
  addLeadComment,
  updateLeadComment,
  deleteLeadComment,
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
  type LeadCommentItem,
  type LeadHistoryItem,
  type LeadTaskItem,
  type LeadReminderItem,
} from '@/api/leads'
import { getDepartment, type DepartmentDetail } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
import type { Dayjs } from 'dayjs'
import {
  LeadInfoCard,
  CommentsSection,
  NotesSection,
  ActivityByDayCard,
  TimeInStatusesCard,
  TasksCard,
  RemindersCard,
  LeadHistorySection,
  SourceMetaBlock,
  LeadEditDialog,
  LeadDeleteDialog,
  NoteEditDialog,
  NoteDeleteDialog,
  CommentEditDialog,
  CommentDeleteDialog,
} from './components'

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
  const [editPhone2, setEditPhone2] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editEmail2, setEditEmail2] = useState('')
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
  const [comments, setComments] = useState<LeadCommentItem[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentEditId, setCommentEditId] = useState<string | null>(null)
  const [commentEditContent, setCommentEditContent] = useState('')
  const [commentEditSaving, setCommentEditSaving] = useState(false)
  const [commentDeleteId, setCommentDeleteId] = useState<string | null>(null)
  const [commentDeleting, setCommentDeleting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
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
    let list: LeadHistoryItem[] = history
    if (lead?.createdAt && lead?.createdBy && lead?._id && !hasCreated) {
      const createdEntry: LeadHistoryItem = {
        _id: '_created',
        leadId: lead._id,
        action: 'created',
        userId: lead.createdBy,
        createdAt: lead.createdAt,
        meta: { name: lead.name },
      }
      list = [createdEntry, ...history]
    }
    // Последние изменения сверху, первые внизу
    return [...list].reverse()
  }, [history, lead?.createdAt, lead?.createdBy, lead?._id, lead?.name])

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
    getLeadComments(id).then(setComments).catch(() => setComments([])).finally(() => setLoadingComments(false))
    getLeadHistory(id).then(setHistory).catch(() => setHistory([])).finally(() => setLoadingHistory(false))
    getLeadTasks(id).then(setTasks).catch(() => setTasks([])).finally(() => setLoadingTasks(false))
    getLeadReminders(id).then(setReminders).catch(() => setReminders([])).finally(() => setLoadingReminders(false))
  }, [id, lead?._id])

  const refetchNotesAndHistory = () => {
    if (!id) return
    getLeadNotes(id).then(setNotes).catch(() => setNotes([]))
    getLeadComments(id).then(setComments).catch(() => setComments([]))
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
    setEditPhone2(lead.phone2 ?? '')
    setEditEmail(lead.email ?? '')
    setEditEmail2(lead.email2 ?? '')
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

  const canEditOrDeleteComment = (comment: LeadCommentItem) =>
    isManager || String(comment.authorId) === String(currentUser?.userId)

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !commentContent.trim()) return
    setCommentSubmitting(true)
    try {
      await addLeadComment(id, commentContent.trim())
      setCommentContent('')
      toast.success('Комментарий добавлен')
      refetchNotesAndHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const openCommentEdit = (comment: LeadCommentItem) => {
    setCommentEditId(comment._id)
    setCommentEditContent(comment.content)
  }
  const handleSaveCommentEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !commentEditId || !commentEditContent.trim()) return
    setCommentEditSaving(true)
    try {
      await updateLeadComment(id, commentEditId, commentEditContent.trim())
      setCommentEditId(null)
      toast.success('Комментарий сохранён')
      refetchNotesAndHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCommentEditSaving(false)
    }
  }
  const handleDeleteCommentConfirm = async () => {
    if (!id || !commentDeleteId) return
    setCommentDeleting(true)
    try {
      await deleteLeadComment(id, commentDeleteId)
      setCommentDeleteId(null)
      toast.success('Комментарий удалён')
      refetchNotesAndHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCommentDeleting(false)
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
      const payload: Parameters<typeof updateLead>[1] = {
        name: editName.trim(),
        lastName: editLastName.trim() || undefined,
        email: editEmail.trim() || undefined,
        email2: editEmail2.trim() || undefined,
        statusId: editStatusId || undefined,
        assignedTo: editAssignedTo,
      }
      if (!isEmployee) {
        payload.phone = editPhone.trim() || undefined
        payload.phone2 = editPhone2.trim() || undefined
      } else {
        if (!lead?.phone?.trim()) payload.phone = editPhone.trim() || undefined
        if (!lead?.phone2?.trim()) payload.phone2 = editPhone2.trim() || undefined
      }
      const updated = await updateLead(id, payload)
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

  const backFallbackUrl = '/leads' + (lead?.departmentId ? `?departmentId=${lead.departmentId}` : '')

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
        <BackButton fallbackTo={backFallbackUrl}>К списку лидов</BackButton>
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
        <LeadInfoCard
          lead={lead}
          departmentName={department?.name ?? null}
          statusItem={statusItem}
          assignedNames={assignedNames}
          onCopyPhone={() => toast.success('Телефон скопирован')}
          onCopyEmail={() => toast.success('Email скопирован')}
          onCopyPhone2={() => toast.success('Телефон 2 скопирован')}
          onCopyEmail2={() => toast.success('Email 2 скопирован')}
        />
        <CommentsSection
          comments={comments}
          loading={loadingComments}
          content={commentContent}
          onContentChange={setCommentContent}
          onSubmit={handleAddComment}
          submitting={commentSubmitting}
          assigneeNameMap={assigneeNameMap}
          canEditOrDelete={canEditOrDeleteComment}
          onEdit={openCommentEdit}
          onDelete={setCommentDeleteId}
        />
        <NotesSection
          notes={notes}
          loading={loadingNotes}
          content={noteContent}
          onContentChange={setNoteContent}
          onSubmit={handleAddNote}
          submitting={noteSubmitting}
          assigneeNameMap={assigneeNameMap}
          canEditOrDelete={canEditOrDeleteNote}
          onEdit={openNoteEdit}
          onDelete={setNoteDeleteId}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3, alignItems: 'stretch' }}>
        <ActivityByDayCard activityByDay={activityByDay} />
        <TimeInStatusesCard timeInStatuses={timeInStatuses} statuses={statuses} />
        <TasksCard
          tasks={tasks}
          loading={loadingTasks}
          title={taskTitle}
          onTitleChange={setTaskTitle}
          dueAt={taskDueAt}
          onDueAtChange={setTaskDueAt}
          onSubmit={handleAddTask}
          submitting={taskSubmitting}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
        />
        <RemindersCard
          reminders={reminders}
          loading={loadingReminders}
          title={reminderTitle}
          onTitleChange={setReminderTitle}
          remindAt={reminderRemindAt}
          onRemindAtChange={setReminderRemindAt}
          onSubmit={handleAddReminder}
          submitting={reminderSubmitting}
          onDone={handleReminderDone}
          onDelete={handleDeleteReminder}
        />
      </Box>

      <LeadHistorySection
        displayHistory={displayHistory}
        loading={loadingHistory}
        statuses={statuses}
        assigneeNameMap={assigneeNameMap}
      />

      <SourceMetaBlock lead={lead} />

      <LeadEditDialog
        open={editing}
        onClose={() => !saving && setEditing(false)}
        onSubmit={handleSave}
        saving={saving}
        name={editName}
        onNameChange={setEditName}
        lastName={editLastName}
        onLastNameChange={setEditLastName}
        phone={editPhone}
        onPhoneChange={setEditPhone}
        phone2={editPhone2}
        onPhone2Change={setEditPhone2}
        email={editEmail}
        onEmailChange={setEditEmail}
        email2={editEmail2}
        onEmail2Change={setEditEmail2}
        statusId={editStatusId}
        onStatusIdChange={setEditStatusId}
        assignedTo={editAssignedTo}
        onAssignedToChange={setEditAssignedTo}
        statuses={statuses}
        assigneeOptions={assigneeOptions}
        assigneeNameMap={assigneeNameMap}
        isEmployee={isEmployee}
        phoneDisabled={isEmployee && !!lead?.phone?.trim()}
        phone2Disabled={isEmployee && !!lead?.phone2?.trim()}
        phoneHelperText={isEmployee && lead?.phone?.trim() ? 'Только руководитель может изменить' : isEmployee ? 'Можно добавить, если пусто' : undefined}
        phone2HelperText={isEmployee && lead?.phone2?.trim() ? 'Только руководитель может изменить' : isEmployee ? 'Можно добавить, если пусто' : undefined}
      />

      <LeadDeleteDialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
        leadName={lead.name}
      />

      <NoteEditDialog
        open={Boolean(noteEditId)}
        onClose={() => !noteEditSaving && setNoteEditId(null)}
        onSubmit={handleSaveNoteEdit}
        content={noteEditContent}
        onContentChange={setNoteEditContent}
        saving={noteEditSaving}
      />

      <NoteDeleteDialog
        open={Boolean(noteDeleteId)}
        onClose={() => !noteDeleting && setNoteDeleteId(null)}
        onConfirm={handleDeleteNoteConfirm}
        deleting={noteDeleting}
      />

      <CommentEditDialog
        open={Boolean(commentEditId)}
        onClose={() => !commentEditSaving && setCommentEditId(null)}
        onSubmit={handleSaveCommentEdit}
        content={commentEditContent}
        onContentChange={setCommentEditContent}
        saving={commentEditSaving}
      />

      <CommentDeleteDialog
        open={Boolean(commentDeleteId)}
        onClose={() => !commentDeleting && setCommentDeleteId(null)}
        onConfirm={handleDeleteCommentConfirm}
        deleting={commentDeleting}
      />
    </Box>
  )
}

export default LeadCardPage
