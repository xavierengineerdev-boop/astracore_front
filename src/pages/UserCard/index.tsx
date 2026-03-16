import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Tooltip,
  Drawer,
  Grid,
  Avatar,
  alpha,
} from '@mui/material'
import BackButton from '@/components/BackButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import CloseIcon from '@mui/icons-material/Close'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import DonutSmallIcon from '@mui/icons-material/DonutSmall'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getCreatableRoles, ROLE_LABELS } from '@/constants/roles'
import { getUser, updateUser, deleteUser, getUserLeads, getUserLeadStats, type UserItem, type UserLeadStatsResult } from '@/api/users'
import { getDepartments, getDepartment, type DepartmentItem, type DepartmentDetail } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
import { updateLead, bulkUpdateLeads, deleteLead, type LeadItem } from '@/api/leads'
import { getLeadTagsByDepartment, type LeadTagItem } from '@/api/leadTags'
import { formFieldSx } from '@/theme/formStyles'
import LeadCommentPopup from '@/pages/Leads/components/LeadCommentPopup'
import LeadsTable from '@/pages/Leads/components/LeadsTable'
import LeadDeleteDialog from '@/pages/Leads/components/LeadDeleteDialog'
import { ROWS_PER_PAGE_OPTIONS, DATE_PICKER_POPPER_SX } from '@/pages/Leads/constants'
import type { LeadItemWithMeta } from '@/api/users'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts'

const CHART_COLORS = ['#a78bfa', '#818cf8', '#6366f1', '#4f46e5', '#7c3aed', '#8b5cf6']


/** Тултип графиков с белым текстом на тёмном фоне (круговая диаграмма и линейный график) */
function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const name = p.name ?? label ?? ''
  const value = p.value ?? 0
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        color: '#fff',
        fontSize: 12,
        backgroundColor: 'rgba(18, 22, 36, 0.98)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {name} : {value}
    </Box>
  )
}

const UserCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [user, setUser] = useState<UserItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removeFromDeptConfirmOpen, setRemoveFromDeptConfirmOpen] = useState(false)
  const [removingFromDept, setRemovingFromDept] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSip, setEditSip] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editDepartmentId, setEditDepartmentId] = useState('')
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [userLeads, setUserLeads] = useState<{ items: import('@/api/users').LeadItemWithMeta[]; total: number; skip: number; limit: number } | null>(null)
  const [userLeadStats, setUserLeadStats] = useState<UserLeadStatsResult | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [leadsPage, setLeadsPage] = useState(0)
  const [leadsRowsPerPage, setLeadsRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0])
  const [leadFilterStatusId, setLeadFilterStatusId] = useState('')
  const [leadFilterSearch, setLeadFilterSearch] = useState('')
  const [leadFilterPhone, setLeadFilterPhone] = useState('')
  const [leadFilterEmail, setLeadFilterEmail] = useState('')
  const [leadFilterDateFrom, setLeadFilterDateFrom] = useState('')
  const [leadFilterDateTo, setLeadFilterDateTo] = useState('')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [leadSortBy, setLeadSortBy] = useState('updatedAt')
  const [leadSortOrder, setLeadSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusesForFilter, setStatusesForFilter] = useState<StatusItem[]>([])
  const [departmentLeadTags, setDepartmentLeadTags] = useState<LeadTagItem[]>([])
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)
  const [leadDeleteId, setLeadDeleteId] = useState<string | null>(null)
  const [leadDeleting, setLeadDeleting] = useState(false)
  const [commentPopupLead, setCommentPopupLead] = useState<LeadItemWithMeta | null>(null)
  const [commentPopupValue, setCommentPopupValue] = useState('')
  const [commentPopupSaving, setCommentPopupSaving] = useState(false)
  const [selectedUserCardLeadIds, setSelectedUserCardLeadIds] = useState<string[]>([])
  const [bulkReassignAssigneeId, setBulkReassignAssigneeId] = useState('')
  const [bulkReassignSaving, setBulkReassignSaving] = useState(false)
  const [departmentDetailForLeads, setDepartmentDetailForLeads] = useState<DepartmentDetail | null>(null)
  const creatableRoles = getCreatableRoles(currentUser?.role ?? '')
  const isOwnProfile = Boolean(id && currentUser?.userId && String(currentUser.userId) === String(id))
  const canAccess = creatableRoles.length > 0 || isOwnProfile
  const canEditLeadStatusInTable =
    (isOwnProfile || currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'super') &&
    Boolean(user?.departmentId)
  const canReassignLeadsInTable =
    (currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'super') &&
    Boolean(user?.departmentId) &&
    Boolean(departmentDetailForLeads)
  const canEditLeadCommentInTable = canEditLeadStatusInTable
  const assigneeOptionsForLeads = React.useMemo(() => {
    if (!departmentDetailForLeads) return []
    const list: { id: string; label: string }[] = []
    const label = (u: { firstName?: string; lastName?: string; email: string }) =>
      [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email
    if (departmentDetailForLeads.manager) {
      list.push({ id: departmentDetailForLeads.manager._id, label: label(departmentDetailForLeads.manager) + ' (рук.)' })
    }
    ;(departmentDetailForLeads.employees || []).forEach((e) => {
      list.push({ id: e._id, label: label(e) })
    })
    return list
  }, [departmentDetailForLeads])
  const assigneeNameMapForLeads = React.useMemo(
    () => new Map(assigneeOptionsForLeads.map((o) => [o.id, o.label])),
    [assigneeOptionsForLeads],
  )
  /** Исполнители отдела для переназначения (все кроме текущего сотрудника — карточка которого открыта) */
  const assigneeOptionsForBulkReassign = React.useMemo(
    () => (id ? assigneeOptionsForLeads.filter((o) => o.id !== id) : assigneeOptionsForLeads),
    [assigneeOptionsForLeads, id],
  )
  const allSelectedOnUserCardPage =
    userLeads && userLeads.items.length > 0 && userLeads.items.every((l) => selectedUserCardLeadIds.includes(l._id))
  const toggleSelectAllUserCardLeads = () => {
    if (!userLeads) return
    if (allSelectedOnUserCardPage) setSelectedUserCardLeadIds([])
    else setSelectedUserCardLeadIds(userLeads.items.map((l) => l._id))
  }
  const toggleSelectUserCardLead = (leadId: string) => {
    setSelectedUserCardLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId],
    )
  }

  useEffect(() => {
    if (!canAccess || !id) {
      setLoading(false)
      return
    }
    let cancelled = false
    Promise.all([getUser(id), getDepartments()])
      .then(([userData, deptList]) => {
        if (!cancelled) {
          setUser(userData)
          setDepartments(deptList)
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Пользователь не найден')
          navigate('/users')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [canAccess, id])

  useEffect(() => {
    if (!id || !user) return
    const deptId = user.departmentId
    if (deptId) {
      getStatusesByDepartment(deptId).then((list) => setStatusesForFilter(list)).catch(() => setStatusesForFilter([]))
    } else {
      setStatusesForFilter([])
    }
  }, [id, user?.departmentId])

  useEffect(() => {
    if (!user?.departmentId) {
      setDepartmentLeadTags([])
      return
    }
    let cancelled = false
    getLeadTagsByDepartment(user.departmentId)
      .then((tags) => { if (!cancelled) setDepartmentLeadTags(tags) })
      .catch(() => { if (!cancelled) setDepartmentLeadTags([]) })
    return () => { cancelled = true }
  }, [user?.departmentId])

  const leadTagMap = React.useMemo(() => {
    const m: Record<string, { name: string; color: string }> = {}
    departmentLeadTags.forEach((t) => { m[t._id] = { name: t.name, color: t.color || '#9ca3af' } })
    return m
  }, [departmentLeadTags])

  useEffect(() => {
    if (!user?.departmentId) {
      setDepartmentDetailForLeads(null)
      return
    }
    getDepartment(user.departmentId)
      .then(setDepartmentDetailForLeads)
      .catch(() => setDepartmentDetailForLeads(null))
  }, [user?.departmentId])

  // Аналитика загружается один раз при открытии карточки — при смене фильтра таблицы не перезапрашиваем.
  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    setLoadingStats(true)
    getUserLeadStats(id, 14)
      .then((statsData) => {
        if (!cancelled) setUserLeadStats(statsData)
      })
      .catch(() => {
        if (!cancelled) setUserLeadStats(null)
      })
      .finally(() => { if (!cancelled) setLoadingStats(false) })
    return () => { cancelled = true }
  }, [id, user])

  // Таблица лидов — перезапрос при смене страницы, фильтров или сортировки.
  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    setLoadingLeads(true)
    getUserLeads(id, {
      skip: leadsPage * leadsRowsPerPage,
      limit: leadsRowsPerPage,
      name: leadFilterSearch.trim() || undefined,
      phone: leadFilterPhone.trim() || undefined,
      email: leadFilterEmail.trim() || undefined,
      statusId: leadFilterStatusId || undefined,
      lastCommentDateFrom: leadFilterDateFrom.trim() || undefined,
      lastCommentDateTo: leadFilterDateTo.trim() || undefined,
      sortBy: leadSortBy,
      sortOrder: leadSortOrder,
    })
      .then((leadsData) => {
        if (!cancelled) setUserLeads(leadsData)
      })
      .catch(() => {
        if (!cancelled) setUserLeads(null)
      })
      .finally(() => { if (!cancelled) setLoadingLeads(false) })
    return () => { cancelled = true }
  }, [id, user, leadsPage, leadsRowsPerPage, leadFilterStatusId, leadFilterSearch, leadFilterPhone, leadFilterEmail, leadFilterDateFrom, leadFilterDateTo, leadSortBy, leadSortOrder])

  const refetchUserLeads = () => {
    if (!id || !user) return
    getUserLeads(id, {
      skip: leadsPage * leadsRowsPerPage,
      limit: leadsRowsPerPage,
      name: leadFilterSearch.trim() || undefined,
      phone: leadFilterPhone.trim() || undefined,
      email: leadFilterEmail.trim() || undefined,
      statusId: leadFilterStatusId || undefined,
      lastCommentDateFrom: leadFilterDateFrom.trim() || undefined,
      lastCommentDateTo: leadFilterDateTo.trim() || undefined,
      sortBy: leadSortBy,
      sortOrder: leadSortOrder,
    })
      .then(setUserLeads)
      .catch(() => setUserLeads(null))
  }

  const handleLeadStatusChange = async (leadId: string, newStatusId: string) => {
    setUpdatingLeadId(leadId)
    try {
      await updateLead(leadId, { statusId: newStatusId || undefined })
      toast.success('Статус обновлён')
      refetchUserLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось обновить статус')
    } finally {
      setUpdatingLeadId(null)
    }
  }

  const handleLeadAssigneeChange = async (leadId: string, newAssigneeId: string) => {
    setUpdatingLeadId(leadId)
    try {
      await updateLead(leadId, { assignedTo: newAssigneeId ? [newAssigneeId] : [] })
      toast.success('Лид переназначен')
      refetchUserLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось переназначить лид')
    } finally {
      setUpdatingLeadId(null)
    }
  }

  const handleCloserChange = async (leadId: string, closerId: string | null) => {
    setUpdatingLeadId(leadId)
    try {
      await updateLead(leadId, { closerId: closerId || undefined })
      toast.success('Клоузер обновлён')
      refetchUserLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось обновить клоузера')
    } finally {
      setUpdatingLeadId(null)
    }
  }

  const handleLeadTagChange = async (leadId: string, leadTagId: string | null) => {
    setUpdatingLeadId(leadId)
    try {
      await updateLead(leadId, { leadTagId: leadTagId ?? undefined })
      toast.success('Источник обновлён')
      refetchUserLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось обновить источник')
    } finally {
      setUpdatingLeadId(null)
    }
  }

  const handleLeadDelete = async () => {
    if (!leadDeleteId) return
    setLeadDeleting(true)
    try {
      await deleteLead(leadDeleteId)
      toast.success('Лид удалён')
      setLeadDeleteId(null)
      refetchUserLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setLeadDeleting(false)
    }
  }

  const handleBulkReassignSubmit = async () => {
    if (selectedUserCardLeadIds.length === 0 || !bulkReassignAssigneeId) {
      toast.error('Выберите лиды и исполнителя для переназначения')
      return
    }
    setBulkReassignSaving(true)
    try {
      const result = await bulkUpdateLeads(selectedUserCardLeadIds, {
        assignedTo: [bulkReassignAssigneeId],
      })
      toast.success(`Переназначено лидов: ${result.updated}`)
      setSelectedUserCardLeadIds([])
      setBulkReassignAssigneeId('')
      refetchUserLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось переназначить лиды')
    } finally {
      setBulkReassignSaving(false)
    }
  }

  const openCommentPopup = (lead: LeadItemWithMeta) => {
    setCommentPopupLead(lead)
    setCommentPopupValue('')
  }

  const handleCommentPopupSave = async () => {
    if (!commentPopupLead) return
    setCommentPopupSaving(true)
    try {
      await updateLead(commentPopupLead._id, { comment: commentPopupValue.trim() })
      toast.success('Комментарий сохранён')
      refetchUserLeads()
      setCommentPopupLead(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCommentPopupSaving(false)
    }
  }

  if (!canAccess) {
    return (
      <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
          Карточка пользователя
        </Typography>
        <Typography color="rgba(255,255,255,0.6)">Нет доступа к этой карточке.</Typography>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
      </Box>
    )
  }

  if (!user) return null

  const startEdit = () => {
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditFirstName(user.firstName ?? '')
    setEditLastName(user.lastName ?? '')
    setEditPhone(user.phone ?? '')
    setEditSip(user.sip ?? '')
    setEditIsActive(user.isActive !== false)
    setEditDepartmentId(user.departmentId ?? '')
    setEditing(true)
  }

  const canEditThisUser =
    isOwnProfile ||
    currentUser?.role === 'super' ||
    (currentUser?.role === 'admin' && user && ['manager', 'employee'].includes(user.role)) ||
    (currentUser?.role === 'manager' && user?.role === 'employee' && String(user.departmentId) === String((currentUser as { departmentId?: string }).departmentId))
  const canDeleteThisUser =
    !isOwnProfile &&
    (currentUser?.role === 'super' ||
      (currentUser?.role === 'admin' && user && ['manager', 'employee'].includes(user.role)) ||
      (currentUser?.role === 'manager' && user?.role === 'employee' && String(user.departmentId) === String((currentUser as { departmentId?: string }).departmentId)))
  const canEditRole =
    !isOwnProfile &&
    creatableRoles.length > 0 &&
    (currentUser?.role === 'super' || (currentUser?.role === 'admin' && ['manager', 'employee'].includes(user.role)))
  const canRemoveFromDept =
    !isOwnProfile &&
    currentUser?.role === 'manager' &&
    user?.role === 'employee' &&
    user?.departmentId &&
    String(user.departmentId) === String((currentUser as { departmentId?: string }).departmentId)

  const cancelEdit = () => {
    setEditing(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const payload: Parameters<typeof updateUser>[1] = {
        email: editEmail.trim(),
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
        sip: editSip.trim(),
      }
      if (canEditRole) payload.role = editRole
      if (!isOwnProfile) payload.isActive = editIsActive
      if (canEditThisUser && !isOwnProfile) payload.departmentId = editDepartmentId || undefined
      const updated = await updateUser(id, payload)
      setUser(updated)
      setEditing(false)
      toast.success('Данные сохранены')
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
      await deleteUser(id)
      toast.success('Пользователь удалён')
      navigate('/users')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  const handleRemoveFromDeptConfirm = async () => {
    if (!id) return
    setRemovingFromDept(true)
    try {
      const updated = await updateUser(id, { departmentId: '' })
      setUser(updated)
      setRemoveFromDeptConfirmOpen(false)
      toast.success('Сотрудник убран из отдела')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setRemovingFromDept(false)
    }
  }

  return (
    <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <BackButton
          fallbackTo={
            currentUser?.role === 'manager' || currentUser?.role === 'employee'
              ? (currentUser as { departmentId?: string }).departmentId
                ? `/departments/${(currentUser as { departmentId?: string }).departmentId}`
                : '/departments'
              : creatableRoles.length > 0
                ? '/users'
                : '/'
          }
        >
          {currentUser?.role === 'manager' || currentUser?.role === 'employee'
            ? 'К странице отдела'
            : creatableRoles.length > 0
              ? 'К списку пользователей'
              : 'На главную'}
        </BackButton>
        {canEditThisUser ? (
          <Tooltip title="Редактировать">
            <IconButton onClick={startEdit} sx={{ color: 'rgba(167,139,250,0.9)' }} size="medium">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
        {canRemoveFromDept ? (
          <Tooltip title="Удалить из отдела">
            <IconButton onClick={() => setRemoveFromDeptConfirmOpen(true)} sx={{ color: 'rgba(251,191,36,0.9)' }} size="medium">
              <PersonRemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
        {canDeleteThisUser ? (
          <Tooltip title="Удалить">
            <IconButton onClick={handleDeleteClick} sx={{ color: 'rgba(248,113,113,0.9)' }} size="medium">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
      <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
        Карточка пользователя
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'stretch' }}>
        {/* Профиль: аватар + компактные поля */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              height: '100%',
              p: 2.5,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '4px solid',
              borderLeftColor: user.isActive !== false ? '#a78bfa' : 'rgba(248,113,113,0.6)',
              bgcolor: alpha('#a78bfa', 0.04),
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: alpha('#a78bfa', 0.25),
                  color: '#c4b5fd',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {[user.firstName, user.lastName].filter(Boolean).join(' ')
                  ? [user.firstName, user.lastName].map((s) => (s ?? '').charAt(0)).join('').toUpperCase().slice(0, 2) || user.email.charAt(0).toUpperCase()
                  : <PersonIcon sx={{ fontSize: 36 }} />}
              </Avatar>
              <Typography variant="h6" sx={{ mt: 1.5, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.6)" sx={{ mt: 0.25 }}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') ? user.email : null}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" color="rgba(255,255,255,0.5)">Роль </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                </Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: user.isActive !== false ? alpha('#34d399', 0.15) : alpha('#f87171', 0.15) }}>
                <Typography variant="caption" sx={{ color: user.isActive !== false ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {user.isActive !== false ? 'Активен' : 'Отключён'}
                </Typography>
              </Box>
              {user.departmentId && (
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {departments.find((d) => String(d._id) === String(user.departmentId))?.name ?? '—'}
                  </Typography>
                </Box>
              )}
              {(user.phone?.trim() || user.sip?.trim()) && (
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }}>
                  <Typography variant="caption" color="rgba(255,255,255,0.5)">Телефон / SIP</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.25 }}>
                    {user.phone?.trim() && (
                      <Box
                        component="a"
                        href={`tel:${user.phone.trim().replace(/^\+/, '')}`}
                        sx={{
                          fontSize: '0.75rem',
                          color: 'rgba(167,139,250,0.95)',
                          textDecoration: 'underline',
                          '&:hover': { color: 'rgba(167,139,250,1)' },
                        }}
                      >
                        {user.phone.trim()}
                      </Box>
                    )}
                    {user.sip?.trim() && (
                      <Box
                        component="a"
                        href={user.sip.trim().toLowerCase().startsWith('sip:') ? user.sip.trim() : `sip:${user.sip.trim()}`}
                        sx={{
                          fontSize: '0.75rem',
                          color: 'rgba(167,139,250,0.95)',
                          textDecoration: 'underline',
                          '&:hover': { color: 'rgba(167,139,250,1)' },
                        }}
                      >
                        {user.sip.trim()}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
              <Typography variant="caption" color="rgba(255,255,255,0.45)">
                Создан {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
                {user.lastLoginAt ? ` · Вход ${new Date(user.lastLoginAt).toLocaleDateString('ru-RU')}` : ''}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        {/* Аналитика — одна карточка с тремя блоками внутри */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              height: '100%',
              p: 2.5,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.08)',
              bgcolor: 'rgba(15,18,32,0.4)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
              Аналитика и статистика
            </Typography>
            {loadingStats ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
                <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
              </Box>
            ) : userLeadStats && (userLeadStats.total > 0 || userLeadStats.byStatus.length > 0) ? (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#a78bfa', 0.08),
                      border: '1px solid rgba(167,139,250,0.2)',
                      height: '100%',
                      minHeight: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ContactPageIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
                      <Typography variant="caption" color="rgba(255,255,255,0.7)">Всего лидов</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ color: '#a78bfa', fontWeight: 700, lineHeight: 1.2 }}>
                      {userLeadStats.total}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      height: '100%',
                      minHeight: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <DonutSmallIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }} />
                      <Typography variant="caption" color="rgba(255,255,255,0.7)">По статусам</Typography>
                    </Box>
                    {userLeadStats.byStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                          <Pie
                            data={userLeadStats.byStatus.map((s) => ({ name: s.statusName, value: s.count }))}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={40}
                          >
                            {userLeadStats.byStatus.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={<ChartTooltipContent />}
                            contentStyle={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              padding: 0,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет данных</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      height: '100%',
                      minHeight: 140,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TrendingUpIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }} />
                      <Typography variant="caption" color="rgba(255,255,255,0.7)">Лиды за 14 дней</Typography>
                    </Box>
                    {userLeadStats.overTime.some((d) => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height={100}>
                        <LineChart data={userLeadStats.overTime.map((d) => ({ date: d.date.slice(5), count: d.count }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} allowDecimals={false} width={24} />
                          <RechartsTooltip
                            content={<ChartTooltipContent />}
                            contentStyle={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              padding: 0,
                            }}
                          />
                          <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography variant="body2" color="rgba(255,255,255,0.5)" sx={{ mt: 2 }}>Нет данных</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет данных по аналитике</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Лиды сотрудника — таблица с управлением */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.95)' }}>
        Лиды сотрудника
        {userLeads && userLeads.total > 0 && (
          <Typography component="span" variant="body2" sx={{ ml: 1, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
            ({userLeads.total})
          </Typography>
        )}
      </Typography>
      <Paper sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        {user?.departmentId && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              p: 1.5,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              bgcolor: 'rgba(255,255,255,0.04)',
            }}
          >
            <TextField
              size="small"
              placeholder="Поиск по имени, телефону, email…"
              value={leadFilterSearch}
              onChange={(e) => { setLeadFilterSearch(e.target.value); setLeadsPage(0) }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { color: 'rgba(255,255,255,0.95)', '& input': { py: 0.5 } },
              }}
              sx={{
                width: 220,
                maxWidth: 280,
                flex: '1 1 200px',
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                  '&.Mui-focused fieldset': { borderColor: 'rgba(167,139,250,0.6)' },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
              <Tooltip title="Фильтры">
                <IconButton
                  size="small"
                  onClick={() => setFilterPanelOpen(true)}
                  sx={{
                    color: (leadFilterSearch || leadFilterStatusId || leadFilterPhone || leadFilterEmail || leadFilterDateFrom || leadFilterDateTo) ? 'rgba(167,139,250,0.95)' : 'rgba(167,139,250,0.8)',
                    bgcolor: (leadFilterSearch || leadFilterStatusId || leadFilterPhone || leadFilterEmail || leadFilterDateFrom || leadFilterDateTo) ? 'rgba(167,139,250,0.15)' : 'transparent',
                  }}
                  aria-label="Открыть фильтры"
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Сбросить фильтры">
                <IconButton
                  size="small"
                  onClick={() => {
                    setLeadFilterSearch('')
                    setLeadFilterStatusId('')
                    setLeadFilterPhone('')
                    setLeadFilterEmail('')
                    setLeadFilterDateFrom('')
                    setLeadFilterDateTo('')
                    setLeadsPage(0)
                  }}
                  disabled={!leadFilterSearch && !leadFilterStatusId && !leadFilterPhone && !leadFilterEmail && !leadFilterDateFrom && !leadFilterDateTo}
                  sx={{
                    color: (leadFilterSearch || leadFilterStatusId || leadFilterPhone || leadFilterEmail || leadFilterDateFrom || leadFilterDateTo) ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                  }}
                  aria-label="Сбросить фильтры"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        {/* Боковая панель фильтров лидов сотрудника */}
        {user?.departmentId && (
          <Drawer
            anchor="right"
            open={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            PaperProps={{
              sx: {
                width: { xs: '100%', sm: 360 },
                bgcolor: 'rgba(18,18,24,0.98)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                  Фильтры и сортировка
                </Typography>
                <IconButton onClick={() => setFilterPanelOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }} aria-label="Закрыть">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
                <TextField
                  size="small"
                  label="Имя"
                  placeholder="Поиск по имени…"
                  value={leadFilterSearch}
                  onChange={(e) => { setLeadFilterSearch(e.target.value); setLeadsPage(0) }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={formFieldSx}
                  InputProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
                />
                <TextField
                  size="small"
                  label="Телефон"
                  placeholder="Поиск по телефону…"
                  value={leadFilterPhone}
                  onChange={(e) => { setLeadFilterPhone(e.target.value); setLeadsPage(0) }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={formFieldSx}
                  InputProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
                />
                <TextField
                  size="small"
                  label="Email"
                  placeholder="Поиск по email…"
                  value={leadFilterEmail}
                  onChange={(e) => { setLeadFilterEmail(e.target.value); setLeadsPage(0) }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={formFieldSx}
                  InputProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
                />
                {statusesForFilter.length > 0 && (
                  <TextField
                    select
                    size="small"
                    label="Статус"
                    value={leadFilterStatusId}
                    onChange={(e) => { setLeadFilterStatusId(e.target.value); setLeadsPage(0) }}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={formFieldSx}
                    SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
                  >
                    <MenuItem value="">Все статусы</MenuItem>
                    {statusesForFilter.map((s) => (
                      <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                    ))}
                  </TextField>
                )}
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                  <DatePicker
                    label="Дата от (последний комментарий)"
                    value={leadFilterDateFrom ? dayjs(leadFilterDateFrom) : null}
                    onChange={(val: Dayjs | null) => {
                      setLeadFilterDateFrom(val ? val.format('YYYY-MM-DD') : '')
                      setLeadsPage(0)
                    }}
                    slotProps={{ popper: { sx: DATE_PICKER_POPPER_SX }, textField: { fullWidth: true } }}
                    sx={formFieldSx}
                  />
                  <DatePicker
                    label="Дата по (последний комментарий)"
                    value={leadFilterDateTo ? dayjs(leadFilterDateTo) : null}
                    onChange={(val: Dayjs | null) => {
                      setLeadFilterDateTo(val ? val.format('YYYY-MM-DD') : '')
                      setLeadsPage(0)
                    }}
                    slotProps={{ popper: { sx: DATE_PICKER_POPPER_SX }, textField: { fullWidth: true } }}
                    sx={formFieldSx}
                  />
                </LocalizationProvider>
                <TextField
                  select
                  size="small"
                  label="Сортировка"
                  value={leadSortBy}
                  onChange={(e) => { setLeadSortBy(e.target.value); setLeadsPage(0) }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={formFieldSx}
                  SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
                >
                  <MenuItem value="updatedAt">По дате изменения</MenuItem>
                  <MenuItem value="createdAt">По дате создания</MenuItem>
                  <MenuItem value="name">По имени</MenuItem>
                  <MenuItem value="phone">По телефону</MenuItem>
                  <MenuItem value="email">По email</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Порядок"
                  value={leadSortOrder}
                  onChange={(e) => { setLeadSortOrder(e.target.value as 'asc' | 'desc'); setLeadsPage(0) }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={formFieldSx}
                  SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
                >
                  <MenuItem value="desc">По убыванию</MenuItem>
                  <MenuItem value="asc">По возрастанию</MenuItem>
                </TextField>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setLeadFilterSearch('')
                  setLeadFilterStatusId('')
                  setLeadFilterPhone('')
                  setLeadFilterEmail('')
                  setLeadFilterDateFrom('')
                  setLeadFilterDateTo('')
                  setLeadSortBy('updatedAt')
                  setLeadSortOrder('desc')
                  setLeadsPage(0)
                  setFilterPanelOpen(false)
                }}
                sx={{
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.9)',
                  textTransform: 'uppercase',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                Сбросить фильтры
              </Button>
            </Box>
          </Drawer>
        )}
        {!userLeads && loadingLeads ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
          </Box>
        ) : userLeads && (userLeads.items.length > 0 || loadingLeads) ? (
          <>
            {canReassignLeadsInTable && selectedUserCardLeadIds.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  p: 2,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  bgcolor: 'rgba(167,139,250,0.08)',
                }}
              >
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Выбрано лидов: {selectedUserCardLeadIds.length}
                </Typography>
                <TextField
                  select
                  size="small"
                  label="Переназначить на"
                  value={bulkReassignAssigneeId}
                  onChange={(e) => setBulkReassignAssigneeId(e.target.value)}
                  disabled={bulkReassignSaving || assigneeOptionsForBulkReassign.length === 0}
                  sx={{ minWidth: 220, ...formFieldSx }}
                  SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
                >
                  <MenuItem value="">— Выберите исполнителя</MenuItem>
                  {assigneeOptionsForBulkReassign.map((o) => (
                    <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                  ))}
                </TextField>
                <Button
                  size="small"
                  variant="contained"
                  disabled={bulkReassignSaving || !bulkReassignAssigneeId}
                  onClick={handleBulkReassignSubmit}
                  sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
                >
                  {bulkReassignSaving ? 'Переназначение…' : 'Переназначить'}
                </Button>
                <Button
                  size="small"
                  onClick={() => { setSelectedUserCardLeadIds([]); setBulkReassignAssigneeId('') }}
                  disabled={bulkReassignSaving}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Снять выделение
                </Button>
              </Box>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 400 }}>
              <LeadsTable
                leads={userLeads.items as LeadItem[]}
                loading={loadingLeads}
                total={userLeads.total}
                page={leadsPage}
                rowsPerPage={leadsRowsPerPage}
                onPageChange={(_, p) => setLeadsPage(p)}
                onRowsPerPageChange={(e) => { setLeadsRowsPerPage(parseInt(e.target.value, 10)); setLeadsPage(0) }}
                statuses={statusesForFilter}
                leadTagMap={leadTagMap}
                leadTagOptions={departmentLeadTags.map((t) => ({ id: t._id, name: t.name, color: t.color || '#9ca3af' }))}
                onLeadTagChange={handleLeadTagChange}
                assigneeOptions={assigneeOptionsForLeads}
                assigneeNameMap={Object.fromEntries(assigneeNameMapForLeads)}
                canBulkEdit={canReassignLeadsInTable}
                canCreateLead={true}
                isEmployee={currentUser?.role === 'employee'}
                currentUserId={currentUser?.userId}
                selectedLeadIds={selectedUserCardLeadIds}
                allSelectedOnPage={!!allSelectedOnUserCardPage}
                someSelected={selectedUserCardLeadIds.length > 0}
                onToggleSelectAll={toggleSelectAllUserCardLeads}
                onToggleSelectLead={toggleSelectUserCardLead}
                sortBy={leadSortBy}
                sortOrder={leadSortOrder}
                onSortUpdatedAt={() => {
                  const nextOrder = leadSortBy === 'updatedAt' && leadSortOrder === 'desc' ? 'asc' : 'desc'
                  setLeadSortBy('updatedAt')
                  setLeadSortOrder(nextOrder)
                  setLeadsPage(0)
                }}
                onSortReset={() => { setLeadSortBy('updatedAt'); setLeadSortOrder('desc'); setLeadsPage(0) }}
                onStatusChange={handleLeadStatusChange}
                onAssignedToChange={(leadId, assignedTo) => handleLeadAssigneeChange(leadId, assignedTo[0] ?? '')}
                onCloserChange={handleCloserChange}
                onEditLead={(lead) => window.open(`/leads/${lead._id}${lead.departmentId ? `?departmentId=${lead.departmentId}` : ''}`, '_blank', 'noopener,noreferrer')}
                onDeleteLead={setLeadDeleteId}
                updatingLeadId={updatingLeadId}
                getLeadUrl={(lid) => { const lead = userLeads?.items.find((l) => l._id === lid); return `/leads/${lid}${lead?.departmentId ? `?departmentId=${lead.departmentId}` : ''}` }}
                onCommentClick={canEditLeadCommentInTable ? openCommentPopup : undefined}
                onCopyPhone={() => toast.success('Телефон скопирован')}
                onCopyEmail={() => toast.success('Email скопирован')}
              />
            </Box>
            <LeadCommentPopup
              open={!!commentPopupLead}
              onClose={() => !commentPopupSaving && setCommentPopupLead(null)}
              leadName={commentPopupLead ? [commentPopupLead.name, commentPopupLead.lastName].filter(Boolean).join(' ').trim() || undefined : undefined}
              comment={commentPopupValue}
              onCommentChange={setCommentPopupValue}
              onSave={handleCommentPopupSave}
              saving={commentPopupSaving}
            />
            <LeadDeleteDialog
              open={!!leadDeleteId}
              onClose={() => !leadDeleting && setLeadDeleteId(null)}
              onConfirm={handleLeadDelete}
              deleting={leadDeleting}
            />
          </>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <ContactPageIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="body2" color="rgba(255,255,255,0.5)" sx={{ mt: 1 }}>
              {loadingLeads ? 'Загрузка…' : 'Нет лидов, назначенных на этого сотрудника'}
            </Typography>
            {user?.departmentId && (
              <Button
                size="small"
                sx={{ mt: 2, color: 'rgba(167,139,250,0.9)' }}
                onClick={() => navigate(`/leads?departmentId=${user.departmentId}`)}
              >
                Перейти к лидам отдела
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Редактирование — отдельный диалог */}
      <Dialog
        open={editing}
        onClose={() => !saving && cancelEdit()}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 22, 36, 0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2 }}>
          Редактирование пользователя
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              label="Имя"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Фамилия"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Телефон"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              fullWidth
              placeholder="+380501234567"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="SIP (телефония)"
              value={editSip}
              onChange={(e) => setEditSip(e.target.value)}
              fullWidth
              placeholder="sip:user@domain или номер"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            {canEditThisUser && !isOwnProfile ? (
              <TextField
                select
                label="Отдел"
                value={editDepartmentId}
                onChange={(e) => setEditDepartmentId(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2, ...formFieldSx }}
                SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
              >
                <MenuItem value="">— Без отдела</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </TextField>
            ) : null}
            {canEditRole ? (
              <TextField
                select
                label="Роль"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2, ...formFieldSx }}
                SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
              >
                {creatableRoles.map((r) => (
                  <MenuItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            {canEditThisUser && !isOwnProfile ? (
              <FormControlLabel
                control={
                  <Switch
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                  />
                }
                label={<Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Активен</Typography>}
              />
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
            <Button onClick={cancelEdit} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
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

      {/* Подтверждение удаления */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 22, 36, 0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>
          Удалить пользователя?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {user.email} — действие нельзя отменить.
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

      {/* Подтверждение: убрать из отдела */}
      <Dialog
        open={removeFromDeptConfirmOpen}
        onClose={() => !removingFromDept && setRemoveFromDeptConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 22, 36, 0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>
          Удалить сотрудника из отдела?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {user?.email} будет убран из вашего отдела. Учётная запись останется, пользователь сможет быть назначен в другой отдел.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveFromDeptConfirmOpen(false)} disabled={removingFromDept} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleRemoveFromDeptConfirm}
            disabled={removingFromDept}
            sx={{ bgcolor: 'rgba(251,191,36,0.8)', color: '#000', '&:hover': { bgcolor: 'rgba(251,191,36,1)' } }}
          >
            {removingFromDept ? '…' : 'Удалить из отдела'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserCardPage
