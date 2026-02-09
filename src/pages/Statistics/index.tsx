import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Stack,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getDepartments, type DepartmentItem } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
import { getLeadStats, type LeadStatsResult } from '@/api/leads'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import * as XLSX from 'xlsx'
import 'dayjs/locale/ru'

dayjs.locale('ru')

const formFieldSx = {
  '& .MuiOutlinedInput-root': { minHeight: 44 },
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function assigneeLabel(name: string, isManager: boolean): string {
  return isManager ? `${name} (Руководитель)` : `${name} (Сотрудник)`
}

function exportStatsToCsv(stats: LeadStatsResult): void {
  const statusNames = stats.statuses.map((s) => s.name)
  const header = ['Ответственный', ...statusNames, 'Всего']
  const rows = stats.rows.map((r) => [
    assigneeLabel(r.assigneeName, r.isManager),
    ...r.byStatus.map((b) => String(b.count)),
    String(r.total),
  ])
  const lines = [header.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))]
  const csv = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `stats-${stats.departmentName.replace(/[^\w\s-]/g, '')}-${dayjs().format('YYYY-MM-DD')}.csv`)
}

function exportStatsToXlsx(stats: LeadStatsResult): void {
  const statusNames = stats.statuses.map((s) => s.name)
  const header = ['Ответственный', ...statusNames, 'Всего']
  const rows = stats.rows.map((r) => [
    assigneeLabel(r.assigneeName, r.isManager),
    ...r.byStatus.map((b) => b.count),
    r.total,
  ])
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Статистика')
  XLSX.writeFile(wb, `stats-${stats.departmentName.replace(/[^\w\s-]/g, '')}-${dayjs().format('YYYY-MM-DD')}.xlsx`)
}

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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
          Статистика по лидам
        </Typography>

        <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(18, 22, 36, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 220, ...formFieldSx }}>
              <InputLabel>Отдел</InputLabel>
              <Select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                label="Отдел"
                disabled={loadingDepts}
              >
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ minWidth: 160 }}>
              <DatePicker
                label="Дата от"
                value={dateFrom}
                onChange={(v) => setDateFrom(v)}
                slotProps={{ textField: { size: 'small', sx: formFieldSx } }}
              />
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <DatePicker
                label="Дата до"
                value={dateTo}
                onChange={(v) => setDateTo(v)}
                slotProps={{ textField: { size: 'small', sx: formFieldSx } }}
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 200, ...formFieldSx }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={filterStatusId}
                onChange={(e) => setFilterStatusId(e.target.value)}
                label="Статус"
              >
                <MenuItem value="">Все статусы</MenuItem>
                {statuses.map((s) => (
                  <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {loadingStats && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
          </Box>
        )}

        {!loadingStats && stats && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {stats.departmentName}
                {stats.filters && (stats.filters.dateFrom || stats.filters.dateTo || stats.filters.statusId) && (
                  <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', ml: 1 }}>
                    (с фильтрами)
                  </Typography>
                )}
              </Typography>
              {canExport && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExportStats('csv')} sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.5)' }}>
                    Статистика CSV
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExportStats('xlsx')} sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.5)' }}>
                    Статистика XLSX
                  </Button>
                </Stack>
              )}
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(18, 22, 36, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Ответственный</TableCell>
                    {stats.statuses.map((s) => (
                      <TableCell key={s._id} align="right" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.name}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Всего</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.rows.map((r) => (
                    <TableRow key={r.assigneeId}>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.9)' }}>{assigneeLabel(r.assigneeName, r.isManager)}</TableCell>
                      {r.byStatus.map((b) => (
                        <TableCell key={b.statusId} align="right" sx={{ color: 'rgba(255,255,255,0.9)' }}>{b.count}</TableCell>
                      ))}
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>{r.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {!loadingStats && !stats && selectedDepartmentId && (
          <Typography color="rgba(255,255,255,0.5)">Нет данных по выбранному отделу.</Typography>
        )}
      </Box>
    </LocalizationProvider>
  )
}

export default StatisticsPage
