import React from 'react'
import { Box, Typography, Paper, TextField, Button, IconButton, Checkbox, CircularProgress } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { formatDateTime } from '../constants'
import { smallCardPaperSx } from '../constants'
import type { LeadTaskItem } from '@/api/leads'

export interface TasksCardProps {
  tasks: LeadTaskItem[]
  loading: boolean
  title: string
  onTitleChange: (v: string) => void
  dueAt: Dayjs | null
  onDueAtChange: (v: Dayjs | null) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  onToggle: (task: LeadTaskItem) => void
  onDelete: (taskId: string) => void
}

const TasksCard: React.FC<TasksCardProps> = ({
  tasks,
  loading,
  title,
  onTitleChange,
  dueAt,
  onDueAtChange,
  onSubmit,
  submitting,
  onToggle,
  onDelete,
}) => (
  <Paper sx={smallCardPaperSx}>
    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
      Задачи
    </Typography>
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <Box component="form" onSubmit={onSubmit} sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Название задачи"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={submitting}
          sx={{ mb: 1, ...formFieldSx }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
          <DateTimePicker
            label="Дедлайн"
            value={dueAt}
            onChange={(v) => onDueAtChange(v)}
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
          startIcon={<TaskAltIcon />}
          disabled={submitting || !title.trim()}
          sx={{ color: 'rgba(167,139,250,0.95)' }}
        >
          {submitting ? 'Добавление…' : 'Добавить задачу'}
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={20} sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : tasks.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет задач</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {tasks.map((task) => (
            <Box
              key={task._id}
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
              <Checkbox
                size="small"
                checked={task.completed}
                onChange={() => onToggle(task)}
                sx={{ color: 'rgba(167,139,250,0.7)', p: 0.25, '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: task.completed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </Typography>
                {task.dueAt && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    {formatDateTime(task.dueAt)}
                  </Typography>
                )}
              </Box>
              <IconButton size="small" onClick={() => onDelete(task._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  </Paper>
)

export default TasksCard
