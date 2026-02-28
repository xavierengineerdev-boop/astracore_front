import React from 'react'
import { Box, Paper, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { formFieldSx } from '../constants'
import type { DepartmentItem } from '@/api/departments'
import type { StatusItem } from '@/api/statuses'

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
}

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
}) => (
  <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(18, 22, 36, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 220, ...formFieldSx }}>
          <InputLabel>Отдел</InputLabel>
          <Select
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
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
            onChange={(v) => onDateFromChange(v)}
            slotProps={{ textField: { size: 'small', sx: formFieldSx } }}
          />
        </Box>
        <Box sx={{ minWidth: 160 }}>
          <DatePicker
            label="Дата до"
            value={dateTo}
            onChange={(v) => onDateToChange(v)}
            slotProps={{ textField: { size: 'small', sx: formFieldSx } }}
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 200, ...formFieldSx }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={filterStatusId}
            onChange={(e) => onFilterStatusIdChange(e.target.value)}
            label="Статус"
          >
            <MenuItem value="">Все статусы</MenuItem>
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
