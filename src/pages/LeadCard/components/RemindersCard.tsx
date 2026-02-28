import React from 'react'
import { Box, Typography, Paper, TextField, Button, IconButton, CircularProgress, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { formatDateTime } from '../constants'
import { smallCardPaperSx } from '../constants'
import type { LeadReminderItem } from '@/api/leads'

export interface RemindersCardProps {
  reminders: LeadReminderItem[]
  loading: boolean
  title: string
  onTitleChange: (v: string) => void
  remindAt: Dayjs | null
  onRemindAtChange: (v: Dayjs | null) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  onDone: (reminder: LeadReminderItem) => void
  onDelete: (reminderId: string) => void
}

const RemindersCard: React.FC<RemindersCardProps> = ({
  reminders,
  loading,
  title,
  onTitleChange,
  remindAt,
  onRemindAtChange,
  onSubmit,
  submitting,
  onDone,
  onDelete,
}) => {
  const activeReminders = reminders.filter((r) => !r.done)

  return (
    <Paper sx={smallCardPaperSx}>
      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
        Напоминания
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Box component="form" onSubmit={onSubmit} sx={{ mb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Например: перезвонить"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={submitting}
            sx={{ mb: 1, ...formFieldSx }}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <DateTimePicker
              label="Дата и время"
              value={remindAt}
              onChange={(v) => onRemindAtChange(v)}
              disabled={submitting}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: { mb: 1, ...formFieldSx },
                },
              }}
            />
          </LocalizationProvider>
          <Button
            type="submit"
            size="small"
            startIcon={<NotificationsActiveIcon />}
            disabled={submitting || !title.trim() || !remindAt}
            sx={{ color: 'rgba(167,139,250,0.95)' }}
          >
            {submitting ? 'Добавление…' : 'Добавить напоминание'}
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={20} sx={{ color: 'rgba(167,139,250,0.8)' }} />
          </Box>
        ) : activeReminders.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет активных напоминаний</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {activeReminders.map((reminder) => (
              <Box
                key={reminder._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.05)',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {reminder.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {formatDateTime(reminder.remindAt)}
                  </Typography>
                </Box>
                <Tooltip title="Отметить выполненным">
                  <IconButton size="small" onClick={() => onDone(reminder)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                    <TaskAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => onDelete(reminder._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  )
}

export default RemindersCard
