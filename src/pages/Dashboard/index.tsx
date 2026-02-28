import React, { useState, useEffect } from 'react'
import { Box, Typography, Grid, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
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
import { displayName, greeting } from './constants'
import {
  QuickActionsBar,
  UserCard,
  DepartmentCard,
  SummaryCards,
  LeadsByStatusChart,
  LeadsOverTimeChart,
  RecentLeadsBlock,
  UpcomingRemindersBlock,
  DepartmentsSummaryBlock,
  TopAssigneesBlock,
  AttentionBlock,
  WeekEventsBlock,
  BlocksSkeleton,
} from './components'

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

      <QuickActionsBar departmentId={user?.departmentId} onNavigate={navigate} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <UserCard
            user={user}
            displayName={displayName}
            onOpenProfile={() => user?.userId && navigate(`/users/${user.userId}`)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <DepartmentCard
            department={department}
            loading={loadingDept}
            onOpenDepartment={(id) => navigate(`/departments/${id}`)}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.95)' }}>
        Аналитика
      </Typography>

      {loadingStats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : (
        <>
          <SummaryCards
            usersCount={summary?.usersCount ?? 0}
            departmentsCount={summary?.departmentsCount ?? 0}
            leadsCount={summary?.leadsCount ?? 0}
            onUsersClick={() => navigate('/users')}
            onDepartmentsClick={() => navigate('/departments')}
            onLeadsClick={() => navigate(user?.departmentId ? `/leads?departmentId=${user.departmentId}` : '/leads')}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <LeadsByStatusChart data={leadsByStatus} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LeadsOverTimeChart
                leadsOverTimeRaw={leadsOverTimeRaw}
                periodDays={periodDays}
                onPeriodChange={setPeriodDays}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 4, color: 'rgba(255,255,255,0.95)' }}>
            Дополнительно
          </Typography>
          {loadingBlocks ? (
            <BlocksSkeleton />
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <RecentLeadsBlock leads={recentLeads} onLeadClick={(id) => navigate(`/leads/${id}`)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <UpcomingRemindersBlock reminders={upcomingReminders} onReminderClick={(leadId) => navigate(`/leads/${leadId}`)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DepartmentsSummaryBlock departments={departmentsSummary} onDepartmentClick={(id) => navigate(`/leads?departmentId=${id}`)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TopAssigneesBlock assignees={topAssignees} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AttentionBlock counts={attentionCounts} onLeadsClick={() => navigate('/leads')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <WeekEventsBlock events={weekEvents} onEventClick={(leadId) => navigate(`/leads/${leadId}`)} />
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  )
}

export default Dashboard
