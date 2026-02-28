import React, { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import BackButton from '@/components/BackButton'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getDepartments, type DepartmentItem } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
import { getLeadStats, type LeadStatsResult } from '@/api/leads'
import type { Dayjs } from 'dayjs'
import { exportStatsToCsv, exportStatsToXlsx } from './constants'
import { StatisticsFilters, StatisticsExportBar, StatisticsTable } from './components'

const StatisticsPage: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [stats, setStats] = useState<LeadStatsResult | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null)
  const [dateTo, setDateTo] = useState<Dayjs | null>(null)
  const [filterStatusId, setFilterStatusId] = useState('')

  const canExport = user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    let cancelled = false
    if (user?.role === 'employee') {
      setLoadingDepts(false)
      setDepartments([])
      return () => { cancelled = true }
    }
    if (user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager') {
      getDepartments()
        .then((list) => {
          if (!cancelled) {
            const filtered =
              user?.role === 'manager' && (user as { departmentId?: string }).departmentId
                ? list.filter((d) => String(d._id) === String((user as { departmentId?: string }).departmentId))
                : list
            setDepartments(filtered)
            if (filtered.length > 0 && !selectedDepartmentId) setSelectedDepartmentId(filtered[0]._id)
          }
        })
        .catch(() => { if (!cancelled) setDepartments([]) })
        .finally(() => { if (!cancelled) setLoadingDepts(false) })
    } else {
      setLoadingDepts(false)
    }
    return () => { cancelled = true }
  }, [user?.role])

  useEffect(() => {
    if (!selectedDepartmentId) {
      setStats(null)
      setStatuses([])
      setFilterStatusId('')
      return
    }
    setFilterStatusId('')
  }, [selectedDepartmentId])

  useEffect(() => {
    if (!selectedDepartmentId) return
    let cancelled = false
    setLoadingStats(true)
    const params: { dateFrom?: string; dateTo?: string; statusId?: string } = {}
    if (dateFrom?.isValid()) params.dateFrom = dateFrom.format('YYYY-MM-DD')
    if (dateTo?.isValid()) params.dateTo = dateTo.format('YYYY-MM-DD')
    if (filterStatusId) params.statusId = filterStatusId
    getStatusesByDepartment(selectedDepartmentId).then((list) => { if (!cancelled) setStatuses(list) }).catch(() => {})
    getLeadStats(selectedDepartmentId, Object.keys(params).length ? params : undefined)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Ошибка загрузки статистики')
          setStats(null)
        }
      })
      .finally(() => { if (!cancelled) setLoadingStats(false) })
    return () => { cancelled = true }
  }, [selectedDepartmentId, dateFrom, dateTo, filterStatusId, toast])

  const handleExportStats = (format: 'csv' | 'xlsx') => {
    if (!stats) return
    try {
      if (format === 'csv') exportStatsToCsv(stats)
      else exportStatsToXlsx(stats)
      toast.success('Статистика экспортирована')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка экспорта')
    }
  }

  if (user?.role === 'employee') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="rgba(255,255,255,0.7)">Страница статистики доступна только руководителям, админам и супер-админу.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <BackButton fallbackTo="/" />
        <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
          Статистика по лидам
        </Typography>
      </Box>

      <StatisticsFilters
        departments={departments}
        selectedDepartmentId={selectedDepartmentId}
        onDepartmentChange={setSelectedDepartmentId}
        loadingDepts={loadingDepts}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        statuses={statuses}
        filterStatusId={filterStatusId}
        onFilterStatusIdChange={setFilterStatusId}
      />

      {loadingStats && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      )}

      {!loadingStats && stats && (
        <>
          <StatisticsExportBar
            stats={stats}
            canExport={canExport}
            onExportCsv={() => handleExportStats('csv')}
            onExportXlsx={() => handleExportStats('xlsx')}
          />
          <StatisticsTable stats={stats} />
        </>
      )}

      {!loadingStats && !stats && selectedDepartmentId && (
        <Typography color="rgba(255,255,255,0.5)">Нет данных по выбранному отделу.</Typography>
      )}
    </Box>
  )
}

export default StatisticsPage
