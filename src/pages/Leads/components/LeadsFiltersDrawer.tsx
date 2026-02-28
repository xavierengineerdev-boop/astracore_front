import React from 'react'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Drawer,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { DATE_PICKER_POPPER_SX } from '../constants'
import type { StatusItem } from '@/api/statuses'

export interface LeadsFiltersDrawerProps {
  open: boolean
  onClose: () => void
  name: string
  onNameChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  email: string
  onEmailChange: (v: string) => void
  statusId: string
  onStatusIdChange: (v: string) => void
  leadTagId: string
  onLeadTagIdChange: (v: string) => void
  leadTagOptions: { id: string; name: string; color: string }[]
  assignedTo: string
  onAssignedToChange: (v: string) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
  sortBy: string
  onSortByChange: (v: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (v: 'asc' | 'desc') => void
  statuses: StatusItem[]
  assigneeOptions: { id: string; label: string }[]
  onReset: () => void
}

const LeadsFiltersDrawer: React.FC<LeadsFiltersDrawerProps> = ({
  open,
  onClose,
  name,
  onNameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  statusId,
  onStatusIdChange,
  leadTagId,
  onLeadTagIdChange,
  leadTagOptions,
  assignedTo,
  onAssignedToChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  statuses,
  assigneeOptions,
  onReset,
}) => (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '50%' },
          maxWidth: 480,
          bgcolor: 'rgba(15, 18, 32, 0.98)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)' }}>
            Фильтры и сортировка
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
          <TextField label="Имя" value={name} onChange={(e) => onNameChange(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} />
          <TextField label="Телефон" value={phone} onChange={(e) => onPhoneChange(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} />
          <TextField label="Email" value={email} onChange={(e) => onEmailChange(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} />
          <TextField
            select
            label="Статус"
            value={statusId}
            onChange={(e) => onStatusIdChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={formFieldSx}
            SelectProps={{ displayEmpty: true, sx: { color: 'rgba(255,255,255,0.95)' } }}
          >
            <MenuItem value="">Все статусы</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Источник (откуда лид)"
            value={leadTagId}
            onChange={(e) => onLeadTagIdChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={formFieldSx}
            SelectProps={{ displayEmpty: true, sx: { color: 'rgba(255,255,255,0.95)' } }}
          >
            <MenuItem value="">Все источники</MenuItem>
            {leadTagOptions.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Обрабатывает"
            value={assignedTo}
            onChange={(e) => onAssignedToChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={formFieldSx}
            SelectProps={{ displayEmpty: true, sx: { color: 'rgba(255,255,255,0.95)' } }}
          >
            <MenuItem value="">Все исполнители</MenuItem>
            {assigneeOptions.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
            ))}
          </TextField>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <DatePicker
              label="Дата от (создан)"
              value={dateFrom ? dayjs(dateFrom) : null}
              onChange={(val: Dayjs | null) => onDateFromChange(val ? val.format('YYYY-MM-DD') : '')}
              slotProps={{ popper: { sx: DATE_PICKER_POPPER_SX } }}
              sx={formFieldSx}
            />
            <DatePicker
              label="Дата по (создан)"
              value={dateTo ? dayjs(dateTo) : null}
              onChange={(val: Dayjs | null) => onDateToChange(val ? val.format('YYYY-MM-DD') : '')}
              slotProps={{ popper: { sx: DATE_PICKER_POPPER_SX } }}
              sx={formFieldSx}
            />
          </LocalizationProvider>
          <TextField
            select
            label="Сортировка"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={formFieldSx}
            SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
          >
            <MenuItem value="createdAt">По дате создания</MenuItem>
            <MenuItem value="updatedAt">По дате изменения</MenuItem>
            <MenuItem value="name">По имени</MenuItem>
            <MenuItem value="phone">По телефону</MenuItem>
            <MenuItem value="email">По email</MenuItem>
            <MenuItem value="statusId">По статусу</MenuItem>
          </TextField>
          <TextField
            select
            label="Порядок"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={formFieldSx}
            SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
          >
            <MenuItem value="desc">По убыванию</MenuItem>
            <MenuItem value="asc">По возрастанию</MenuItem>
          </TextField>
        </Box>
        <Button fullWidth variant="outlined" onClick={onReset} sx={{ mt: 2, color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)' }}>
        Сбросить фильтры
      </Button>
    </Box>
  </Drawer>
)

export default LeadsFiltersDrawer
