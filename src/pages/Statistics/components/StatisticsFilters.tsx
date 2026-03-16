import React from 'react'
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  Tooltip,
  IconButton,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import LabelIcon from '@mui/icons-material/Label'
import EventIcon from '@mui/icons-material/Event'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { formFieldSx } from '../constants'
import type { DepartmentItem } from '@/api/departments'
import type { StatusItem } from '@/api/statuses'

export type QuickPeriod = 'week' | 'month' | 'quarter'

export interface StatisticsFiltersProps {
  departments: DepartmentItem[]
  selectedDepartmentId: string
  onDepartmentChange: (id: string) => void
  loadingDepts: boolean
  dateFrom: Dayjs | null
  onDateFromChange: (v: Dayjs | null) => void
  dateTo: Dayjs | null
  onDateToChange: (v: Dayjs | null) => void
  statuses: StatusItem[]
  filterStatusId: string
  onFilterStatusIdChange: (id: string) => void
  onQuickPeriod?: (dateFrom: Dayjs, dateTo: Dayjs) => void
}

function getQuickPeriodRange(period: QuickPeriod): { from: Dayjs; to: Dayjs } {
  const now = dayjs()
  switch (period) {
    case 'week':
      return { from: now.subtract(1, 'week').startOf('day'), to: now }
    case 'month':
      return { from: now.subtract(1, 'month').startOf('month'), to: now.subtract(1, 'month').endOf('month') }
    case 'quarter':
      return { from: now.subtract(1, 'quarter').startOf('quarter'), to: now.subtract(1, 'quarter').endOf('quarter') }
    default:
      return { from: now.subtract(1, 'month').startOf('month'), to: now.subtract(1, 'month').endOf('month') }
  }
}

const filterInputSx = {
  ...formFieldSx,
  '& .MuiOutlinedInput-root': {
    minHeight: 44,
    borderRadius: 2,
    bgcolor: 'rgba(255,255,255,0.04)',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
    '&.Mui-focused': { bgcolor: 'rgba(255,255,255,0.06)' },
  },
  '& .MuiInputAdornment-root': { color: 'rgba(167,139,250,0.7)' },
} as const

const StatisticsFilters: React.FC<StatisticsFiltersProps> = ({
  departments,
  selectedDepartmentId,
  onDepartmentChange,
  loadingDepts,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  statuses,
  filterStatusId,
  onFilterStatusIdChange,
  onQuickPeriod,
}) => (
  <Paper
    sx={{
      p: 2,
      mb: 3,
      borderRadius: 3,
      bgcolor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap alignItems={{ sm: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200, ...filterInputSx }}>
          <InputLabel id="stats-dept-label">Отдел</InputLabel>
          <Select
            labelId="stats-dept-label"
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            label="Отдел"
            disabled={loadingDepts}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 0.5 }}>
                  <BusinessIcon sx={{ fontSize: 20, color: 'rgba(167,139,250,0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiSelect-select': { pl: 1.5 } }}
          >
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {onQuickPeriod && (
          <Box sx={{ display: 'flex', gap: 0.5, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, p: 0.5, bgcolor: 'rgba(255,255,255,0.02)' }}>
            <Tooltip title="Неделя">
              <IconButton size="small" onClick={() => { const { from, to } = getQuickPeriodRange('week'); onQuickPeriod(from, to) }} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}>
                <EventIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Месяц">
              <IconButton size="small" onClick={() => { const { from, to } = getQuickPeriodRange('month'); onQuickPeriod(from, to) }} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}>
                <CalendarMonthIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Квартал">
              <IconButton size="small" onClick={() => { const { from, to } = getQuickPeriodRange('quarter'); onQuickPeriod(from, to) }} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#a78bfa', bgcolor: 'rgba(167,139,250,0.12)' } }}>
                <ViewAgendaIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Box sx={{ minWidth: 150 }}>
          <DatePicker
            value={dateFrom}
            onChange={(v) => onDateFromChange(v)}
            slotProps={{
              textField: {
                size: 'small',
                sx: filterInputSx,
                placeholder: 'От',
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'rgba(167,139,250,0.7)' }}>
                      <CalendarTodayIcon sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
                inputProps: { sx: { pl: 1.5 } },
              },
            }}
          />
        </Box>
        <Box sx={{ minWidth: 150 }}>
          <DatePicker
            value={dateTo}
            onChange={(v) => onDateToChange(v)}
            slotProps={{
              textField: {
                size: 'small',
                sx: filterInputSx,
                placeholder: 'До',
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'rgba(167,139,250,0.7)' }}>
                      <CalendarTodayIcon sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
                inputProps: { sx: { pl: 1.5 } },
              },
            }}
          />
        </Box>

        <FormControl size="small" sx={{ minWidth: 180, ...filterInputSx }}>
          <InputLabel id="stats-status-label">Статус</InputLabel>
          <Select
            labelId="stats-status-label"
            value={filterStatusId}
            onChange={(e) => onFilterStatusIdChange(e.target.value)}
            label="Статус"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 0.5 }}>
                  <LabelIcon sx={{ fontSize: 20, color: 'rgba(167,139,250,0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiSelect-select': { pl: 1.5 } }}
          >
            <MenuItem value="">Все</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </LocalizationProvider>
  </Paper>
)

export default StatisticsFilters
