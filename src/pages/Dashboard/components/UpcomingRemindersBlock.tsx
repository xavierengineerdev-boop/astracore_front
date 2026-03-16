import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Typography, Paper, Button } from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { cardPaperSx } from '../constants'
import type { UpcomingReminderItem } from '@/api/leads'

export interface UpcomingRemindersBlockProps {
  reminders: UpcomingReminderItem[]
  onReminderClick: (leadId: string) => void
}

const UpcomingRemindersBlock: React.FC<UpcomingRemindersBlockProps> = ({ reminders, onReminderClick }) => (
  <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
      <NotificationsActiveIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
      Ближайшие напоминания {reminders.length > 0 ? `(${reminders.length})` : ''}
    </Typography>
    {reminders.length > 0 ? (
      <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
        {reminders.slice(0, 8).map((r) => (
          <Box
            key={r._id}
            component="li"
            sx={{
              py: 0.75,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              '&:hover': { color: '#a78bfa' },
            }}
            onClick={() => onReminderClick(r.leadId)}
          >
            <Typography variant="body2" sx={{ color: 'inherit' }}>{r.title}</Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">
              {r.leadName ?? 'Лид'} · {r.remindAt ? new Date(r.remindAt).toLocaleString('ru-RU') : ''}
            </Typography>
          </Box>
        ))}
      </Box>
    ) : (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
        <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет напоминаний</Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          Создайте напоминание в карточке лида.
        </Typography>
        <Button
          component={RouterLink}
          to="/leads"
          size="small"
          startIcon={<AssignmentIcon />}
          sx={{ color: 'rgba(167,139,250,0.95)', mt: 0.5 }}
        >
          Перейти к лидам
        </Button>
      </Box>
    )}
  </Paper>
)

export default UpcomingRemindersBlock
