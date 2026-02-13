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
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  Avatar,
  alpha,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PersonIcon from '@mui/icons-material/Person'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import DonutSmallIcon from '@mui/icons-material/DonutSmall'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getCreatableRoles, ROLE_LABELS } from '@/constants/roles'
import { getUser, updateUser, deleteUser, getUserLeads, getUserLeadStats, type UserItem, type UserLeadStatsResult } from '@/api/users'
import { getDepartments, type DepartmentItem } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
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

const formFieldSx = {
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
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
  const [editIsActive, setEditIsActive] = useState(true)
  const [editDepartmentId, setEditDepartmentId] = useState('')
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [userLeads, setUserLeads] = useState<{ items: import('@/api/users').LeadItemWithMeta[]; total: number; skip: number; limit: number } | null>(null)
  const [userLeadStats, setUserLeadStats] = useState<UserLeadStatsResult | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [leadsPage, setLeadsPage] = useState(0)
  const [leadsRowsPerPage, setLeadsRowsPerPage] = useState(10)
  const [leadFilterStatusId, setLeadFilterStatusId] = useState('')
  const [statusesForFilter, setStatusesForFilter] = useState<StatusItem[]>([])
  const creatableRoles = getCreatableRoles(currentUser?.role ?? '')
  const isOwnProfile = Boolean(id && currentUser?.userId && String(currentUser.userId) === String(id))
  const canAccess = creatableRoles.length > 0 || isOwnProfile

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

  // Таблица лидов — перезапрос только при смене страницы или фильтра «Статус».
  useEffect(() => {
    if (!id || !user) return
    let cancelled = false
    setLoadingLeads(true)
    getUserLeads(id, {
      skip: leadsPage * leadsRowsPerPage,
      limit: leadsRowsPerPage,
      statusId: leadFilterStatusId || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
      .then((leadsData) => {
        if (!cancelled) setUserLeads(leadsData)
      })
      .catch(() => {
        if (!cancelled) setUserLeads(null)
      })
      .finally(() => { if (!cancelled) setLoadingLeads(false) })
    return () => { cancelled = true }
  }, [id, user, leadsPage, leadsRowsPerPage, leadFilterStatusId])

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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            if (currentUser?.role === 'manager' || currentUser?.role === 'employee') {
              const deptId = (currentUser as { departmentId?: string }).departmentId
              navigate(deptId ? `/departments/${deptId}` : '/departments')
            } else {
              navigate(creatableRoles.length > 0 ? '/users' : '/')
            }
          }}
          sx={{ color: 'rgba(196,181,253,0.9)' }}
        >
          {currentUser?.role === 'manager' || currentUser?.role === 'employee'
            ? 'К странице отдела'
            : creatableRoles.length > 0
              ? 'К списку пользователей'
              : 'На главную'}
        </Button>
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
      </Typography>
      <Paper sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        {user?.departmentId && statusesForFilter.length > 0 && (
          <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <TextField
              select
              size="small"
              label="Статус"
              value={leadFilterStatusId}
              onChange={(e) => { setLeadFilterStatusId(e.target.value); setLeadsPage(0) }}
              sx={{ minWidth: 180, ...formFieldSx }}
              SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
            >
              <MenuItem value="">Все</MenuItem>
              {statusesForFilter.map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}
        {!userLeads && loadingLeads ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
          </Box>
        ) : userLeads && (userLeads.items.length > 0 || loadingLeads) ? (
          <>
            <TableContainer sx={{ position: 'relative', minHeight: 200 }}>
              {loadingLeads && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
                </Box>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Имя</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Контакты</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Статус</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Отдел</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Создан</TableCell>
                    <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userLeads.items.map((lead) => (
                    <TableRow key={lead._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        {[lead.name, lead.lastName].filter(Boolean).join(' ').trim() || '—'}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {lead.phone || lead.email || '—'}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{(lead as import('@/api/users').LeadItemWithMeta).statusName ?? '—'}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{(lead as import('@/api/users').LeadItemWithMeta).departmentName ?? '—'}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('ru-RU') : '—'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Открыть карточку лида">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/leads/${lead._id}${lead.departmentId ? `?departmentId=${lead.departmentId}` : ''}`)}
                            sx={{ color: 'rgba(167,139,250,0.9)' }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={userLeads.total}
              page={leadsPage}
              onPageChange={(_, p) => setLeadsPage(p)}
              rowsPerPage={leadsRowsPerPage}
              onRowsPerPageChange={(e) => { setLeadsRowsPerPage(parseInt(e.target.value, 10)); setLeadsPage(0) }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ color: 'rgba(255,255,255,0.8)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
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
