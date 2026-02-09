import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Link,
  Grid,
  CircularProgress,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  alpha,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import PeopleIcon from '@mui/icons-material/People'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import BarChartIcon from '@mui/icons-material/BarChart'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { ROLE_LABELS } from '@/constants/roles'
import { getDepartment, type DepartmentDetail } from '@/api/departments'
import {
  getDashboardSummary,
  getDashboardLeadsByStatus,
  getDashboardLeadsOverTime,
  getDashboardRecentLeads,
  getDashboardDepartmentsSummary,
  getDashboardTopAssignees,
  getDashboardAttentionCounts,
  getDashboardWeekEvents,
  type DashboardSummary as SummaryType,
  type DashboardLeadsByStatusItem,
  type DashboardLeadsOverTimeItem,
  type DashboardRecentLeadItem,
  type DashboardDepartmentSummaryItem,
  type DashboardTopAssigneeItem,
  type DashboardAttentionCounts as AttentionCountsType,
  type DashboardWeekEventItem,
} from '@/api/dashboard'
import { getUpcomingReminders, type UpcomingReminderItem } from '@/api/leads'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts'

const CHART_COLORS = ['#a78bfa', '#818cf8', '#6366f1', '#4f46e5', '#7c3aed', '#8b5cf6', '#c084fc', '#e879f9']

const PERIOD_OPTIONS = [7, 14, 30] as const

function displayName(user: { firstName?: string; lastName?: string; email: string }): string {
  const first = (user.firstName ?? '').trim()
  const last = (user.lastName ?? '').trim()
  if (first || last) return [first, last].filter(Boolean).join(' ')
  return user.email
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

/** Кастомный тултип для круговой: иконка + название статуса крупно + число выделено */
function PieTooltipContent({ active, payload, total }: { active?: boolean; payload?: ReadonlyArray<{ name: string; value: number }>; total: number }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const pct = total > 0 ? Math.round((p.value / total) * 100) : 0
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'rgba(15,18,32,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 140,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <ContactPageIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600, fontSize: '0.95rem' }}>
          {p.name}
        </Typography>
      </Box>
      <Typography component="span" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
        Лидов:{' '}
      </Typography>
      <Typography component="span" sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem' }}>
        {p.value}
      </Typography>
      <Typography component="span" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', ml: 0.5 }}>
        ({pct}%)
      </Typography>
    </Paper>
  )
}

type LineTooltipProps = TooltipProps<number, string> & { payload?: Array<{ value?: number }>; label?: string }
/** Кастомный тултип для линейного: иконка + дата + число выделено */
function LineTooltipContent(props: LineTooltipProps) {
  const { active, payload, label } = props
  if (!active || !payload?.length) return null
  const value = payload[0].value ?? 0
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'rgba(15,18,32,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 120,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <BarChartIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.9rem' }}>
          {label != null ? `Дата: ${String(label)}` : ''}
        </Typography>
      </Box>
      <Typography component="span" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
        Создано лидов:{' '}
      </Typography>
      <Typography component="span" sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem' }}>
        {value}
      </Typography>
    </Paper>
  )
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [department, setDepartment] = useState<DepartmentDetail | null>(null)
  const [loadingDept, setLoadingDept] = useState(false)
  const [summary, setSummary] = useState<SummaryType | null>(null)
  const [leadsByStatus, setLeadsByStatus] = useState<DashboardLeadsByStatusItem[]>([])
  const [leadsOverTimeRaw, setLeadsOverTimeRaw] = useState<DashboardLeadsOverTimeItem[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [periodDays, setPeriodDays] = useState<number>(14)
  const [activePieIndex, setActivePieIndex] = useState<number>(-1)
  const [recentLeads, setRecentLeads] = useState<DashboardRecentLeadItem[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminderItem[]>([])
  const [departmentsSummary, setDepartmentsSummary] = useState<DashboardDepartmentSummaryItem[]>([])
  const [topAssignees, setTopAssignees] = useState<DashboardTopAssigneeItem[]>([])
  const [attentionCounts, setAttentionCounts] = useState<AttentionCountsType | null>(null)
  const [weekEvents, setWeekEvents] = useState<DashboardWeekEventItem[]>([])
  const [loadingBlocks, setLoadingBlocks] = useState(true)

  useEffect(() => {
    if (!user?.departmentId) {
      setDepartment(null)
      return
    }
    let cancelled = false
    setLoadingDept(true)
    getDepartment(user.departmentId)
      .then((d) => {
        if (!cancelled) setDepartment(d)
      })
      .catch(() => {
        if (!cancelled) setDepartment(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingDept(false)
      })
    return () => { cancelled = true }
  }, [user?.departmentId])

  useEffect(() => {
    let cancelled = false
    setLoadingStats(true)
    Promise.all([
      getDashboardSummary(),
      getDashboardLeadsByStatus(),
      getDashboardLeadsOverTime(periodDays * 2),
    ])
      .then(([s, byStatus, overTime]) => {
        if (!cancelled) {
          setSummary(s)
          setLeadsByStatus(byStatus)
          setLeadsOverTimeRaw(overTime)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null)
          setLeadsByStatus([])
          setLeadsOverTimeRaw([])
        }
      })
      .finally(() => { if (!cancelled) setLoadingStats(false) })
    return () => { cancelled = true }
  }, [periodDays])

  useEffect(() => {
    let cancelled = false
    setLoadingBlocks(true)
    Promise.all([
      getDashboardRecentLeads(10),
      getUpcomingReminders(),
      getDashboardDepartmentsSummary(),
      getDashboardTopAssignees(5),
      getDashboardAttentionCounts(),
      getDashboardWeekEvents(),
    ])
      .then(([recent, reminders, depts, top, attention, events]) => {
        if (!cancelled) {
          setRecentLeads(recent)
          setUpcomingReminders(reminders)
          setDepartmentsSummary(depts)
          setTopAssignees(top)
          setAttentionCounts(attention)
          setWeekEvents(events)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecentLeads([])
          setUpcomingReminders([])
          setDepartmentsSummary([])
          setTopAssignees([])
          setAttentionCounts(null)
          setWeekEvents([])
        }
      })
      .finally(() => { if (!cancelled) setLoadingBlocks(false) })
    return () => { cancelled = true }
  }, [])

  const leadsOverTime = useMemo(() => {
    if (leadsOverTimeRaw.length <= periodDays) return leadsOverTimeRaw
    return leadsOverTimeRaw.slice(-periodDays)
  }, [leadsOverTimeRaw, periodDays])

  const trend = useMemo(() => {
    if (leadsOverTimeRaw.length < periodDays * 2) return null
    const prev = leadsOverTimeRaw.slice(0, periodDays).reduce((s, d) => s + d.count, 0)
    const curr = leadsOverTimeRaw.slice(-periodDays).reduce((s, d) => s + d.count, 0)
    return { current: curr, previous: prev, diff: curr - prev }
  }, [leadsOverTimeRaw, periodDays])

  const totalLeadsForPie = useMemo(
    () => leadsByStatus.reduce((s, i) => s + i.count, 0),
    [leadsByStatus],
  )

  const cardPaperSx = {
    p: 2,
    bgcolor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 2,
    height: '100%',
  }

  return (
    <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600 }}>
            Главная
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            {greeting()}, {user ? displayName(user) : '—'} · {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Box>
      </Box>

      {/* Быстрые действия */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha('#a78bfa', 0.06),
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1.5, fontWeight: 600 }}>
          Быстрые действия
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContactPageIcon />}
            onClick={() => navigate(user?.departmentId ? `/leads?departmentId=${user.departmentId}` : '/leads')}
            sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
          >
            Лиды
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<BarChartIcon />}
            onClick={() => navigate('/statistics')}
            sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
          >
            Статистика
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/users')}
            sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
          >
            Пользователи
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<BusinessIcon />}
            onClick={() => navigate('/departments')}
            sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
          >
            Отделы
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Карточка пользователя */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={cardPaperSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(167,139,250,0.3)',
                  color: '#c4b5fd',
                  width: 48,
                  height: 48,
                }}
              >
                <PersonIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                  {user ? displayName(user) : '—'}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.6)" noWrap>
                  {user?.email ?? '—'}
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mt: 0.5 }}>
                  {user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : '—'}
                </Typography>
                <Link
                  component="button"
                  variant="caption"
                  sx={{ color: 'rgba(167,139,250,0.9)', cursor: 'pointer', mt: 0.5, display: 'inline-block' }}
                  onClick={() => user?.userId && navigate(`/users/${user.userId}`)}
                >
                  Открыть профиль →
                </Link>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Карточка отдела (если привязан) */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={cardPaperSx}>
            {loadingDept ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                  <Skeleton width="40%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                </Box>
              </Box>
            ) : department ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(99,102,241,0.25)',
                    color: '#818cf8',
                    width: 48,
                    height: 48,
                  }}
                >
                  <BusinessIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                    {department.name}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.6)">
                    Сотрудников: {department.employeesCount} · Статусов: {department.statusesCount}
                  </Typography>
                  <Link
                    component="button"
                    variant="caption"
                    sx={{ color: 'rgba(167,139,250,0.9)', cursor: 'pointer', mt: 0.5, display: 'inline-block' }}
                    onClick={() => navigate(`/departments/${department._id}`)}
                  >
                    Открыть отдел →
                  </Link>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.06)', width: 48, height: 48 }}>
                  <BusinessIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                </Avatar>
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  Вы не привязаны к отделу
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Сводка и аналитика */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.95)' }}>
        Аналитика
      </Typography>

      {loadingStats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : (
        <>
          {/* Сводные карточки (кликабельные) */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                sx={{
                  ...cardPaperSx,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(167,139,250,0.25)' },
                }}
                onClick={() => navigate('/users')}
              >
                <Avatar sx={{ bgcolor: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
                    {summary?.usersCount ?? 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.6)">Пользователей</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                sx={{
                  ...cardPaperSx,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(99,102,241,0.25)' },
                }}
                onClick={() => navigate('/departments')}
              >
                <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
                    {summary?.departmentsCount ?? 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.6)">Отделов</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                sx={{
                  ...cardPaperSx,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(52,211,153,0.25)' },
                }}
                onClick={() => navigate(user?.departmentId ? `/leads?departmentId=${user.departmentId}` : '/leads')}
              >
                <Avatar sx={{ bgcolor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
                  <ContactPageIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
                    {summary?.leadsCount ?? 0}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.6)">Лидов</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Графики */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 320 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
                  Лиды по статусам
                </Typography>
                {leadsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={leadsByStatus.map((item) => ({ name: item.statusName, value: item.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(-1)}
                      >
                        {leadsByStatus.map((_, i) => {
                          const base = CHART_COLORS[i % CHART_COLORS.length]
                          const isActive = i === activePieIndex
                          return (
                            <Cell
                              key={i}
                              fill={base}
                              stroke={isActive ? 'rgba(255,255,255,0.5)' : 'transparent'}
                              strokeWidth={isActive ? 2 : 0}
                              style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' : undefined }}
                            />
                          )
                        })}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => (
                          <PieTooltipContent active={active} payload={payload ? [...payload] : undefined} total={totalLeadsForPie} />
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    Нет данных по статусам
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 320 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    Лиды за период
                  </Typography>
                  <ToggleButtonGroup
                    value={periodDays}
                    exclusive
                    onChange={(_, v) => v != null && PERIOD_OPTIONS.includes(v) && setPeriodDays(v)}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.15)',
                        py: 0.5,
                        px: 1.5,
                        '&.Mui-selected': { bgcolor: 'rgba(167,139,250,0.2)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)' },
                      },
                    }}
                  >
                    {PERIOD_OPTIONS.map((d) => (
                      <ToggleButton key={d} value={d} type="button">{d} дн.</ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
                {trend != null && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    {trend.diff > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#34d399' }}>
                        <TrendingUpIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>+{trend.diff} к пред. периоду</Typography>
                      </Box>
                    )}
                    {trend.diff < 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f87171' }}>
                        <TrendingDownIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{trend.diff} к пред. периоду</Typography>
                      </Box>
                    )}
                    {trend.diff === 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.5)' }}>
                        <RemoveIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption">Без изменений</Typography>
                      </Box>
                    )}
                  </Box>
                )}
                {leadsOverTime.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart
                      data={leadsOverTime.map((d) => ({ date: d.date.slice(5), count: d.count }))}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                        stroke="rgba(255,255,255,0.2)"
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                        stroke="rgba(255,255,255,0.2)"
                        allowDecimals={false}
                      />
                      <Tooltip content={<LineTooltipContent />} />
                      <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Создано лидов"
                        stroke="#a78bfa"
                        strokeWidth={2}
                        dot={{ fill: '#a78bfa', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    Нет данных за период
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Ниже: 6 блоков */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 4, color: 'rgba(255,255,255,0.95)' }}>
            Дополнительно
          </Typography>
          {loadingBlocks ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid key={i} size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 200 }}>
                    <Skeleton width="40%" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.08)', mb: 2 }} />
                    <Skeleton width="100%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                    <Skeleton width="90%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                    <Skeleton width="70%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {/* 1. Недавние лиды */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContactPageIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
                    Недавние лиды
                  </Typography>
                  {recentLeads.length > 0 ? (
                    <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                      {recentLeads.slice(0, 8).map((lead) => (
                        <Box
                          key={lead._id}
                          component="li"
                          sx={{
                            py: 0.75,
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            '&:hover': { color: '#a78bfa' },
                          }}
                          onClick={() => navigate(`/leads/${lead._id}`)}
                        >
                          <Typography variant="body2" sx={{ color: 'inherit' }}>
                            {[lead.name, lead.lastName].filter(Boolean).join(' ').trim() || '—'} · {lead.statusName}
                          </Typography>
                          <Typography variant="caption" color="rgba(255,255,255,0.5)">
                            {lead.departmentName} · {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('ru-RU') : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет лидов</Typography>
                  )}
                </Paper>
              </Grid>

              {/* 2. Ближайшие напоминания */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
                    Ближайшие напоминания
                  </Typography>
                  {upcomingReminders.length > 0 ? (
                    <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                      {upcomingReminders.slice(0, 8).map((r) => (
                        <Box
                          key={r._id}
                          component="li"
                          sx={{
                            py: 0.75,
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                            '&:hover': { color: '#a78bfa' },
                          }}
                          onClick={() => navigate(`/leads/${r.leadId}`)}
                        >
                          <Typography variant="body2" sx={{ color: 'inherit' }}>{r.title}</Typography>
                          <Typography variant="caption" color="rgba(255,255,255,0.5)">
                            {r.leadName ?? 'Лид'} · {r.remindAt ? new Date(r.remindAt).toLocaleString('ru-RU') : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет напоминаний</Typography>
                  )}
                </Paper>
              </Grid>

              {/* 3. Сводка по отделам */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ fontSize: 20, color: '#818cf8' }} />
                    Сводка по отделам
                  </Typography>
                  {departmentsSummary.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {departmentsSummary.map((d) => (
                        <Paper
                          key={d.departmentId}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'rgba(167,139,250,0.4)' },
                          }}
                          onClick={() => navigate(`/leads?departmentId=${d.departmentId}`)}
                        >
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)' }}>{d.departmentName}</Typography>
                          <Typography variant="caption" color="rgba(255,255,255,0.6)">{d.leadsCount} лидов</Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет отделов</Typography>
                  )}
                </Paper>
              </Grid>

              {/* 4. Топ ответственных */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ fontSize: 20, color: '#34d399' }} />
                    Топ ответственных
                  </Typography>
                  {topAssignees.length > 0 ? (
                    <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                      {topAssignees.map((a) => (
                        <Box key={a.assigneeId} component="li" sx={{ py: 0.5 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            {a.assigneeName} — {a.leadsCount} лидов
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет данных</Typography>
                  )}
                </Paper>
              </Grid>

              {/* 5. Требуют внимания */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
                    Требуют внимания
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                      }}
                      onClick={() => navigate('/leads')}
                    >
                      <Typography variant="body2" color="rgba(255,255,255,0.9)">Без статуса</Typography>
                      <Typography variant="subtitle2" sx={{ color: '#fbbf24', fontWeight: 600 }}>{attentionCounts?.leadsWithoutStatus ?? 0}</Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                      }}
                      onClick={() => navigate('/leads')}
                    >
                      <Typography variant="body2" color="rgba(255,255,255,0.9)">Без ответственного</Typography>
                      <Typography variant="subtitle2" sx={{ color: '#fbbf24', fontWeight: 600 }}>{attentionCounts?.leadsUnassigned ?? 0}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* 6. События на неделю */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonthIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
                    События на неделю
                  </Typography>
                  {weekEvents.length > 0 ? (
                    <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                      {weekEvents.slice(0, 10).map((ev) => (
                        <Box
                          key={`${ev.type}-${ev.id}`}
                          component="li"
                          sx={{
                            py: 0.75,
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': { color: '#a78bfa' },
                          }}
                          onClick={() => navigate(`/leads/${ev.leadId}`)}
                        >
                          {ev.type === 'reminder' ? <NotificationsActiveIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /> : <AssignmentIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ color: 'inherit' }}>{ev.title}</Typography>
                            <Typography variant="caption" color="rgba(255,255,255,0.5)">
                              {ev.leadName ?? 'Лид'} · {ev.dateTime ? new Date(ev.dateTime).toLocaleString('ru-RU') : ev.date}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет событий на эту неделю</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  )
}

export default Dashboard
