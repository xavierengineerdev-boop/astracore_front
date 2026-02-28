import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
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
      Ближайшие напоминания
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
      <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет напоминаний</Typography>
    )}
  </Paper>
)

export default UpcomingRemindersBlock
