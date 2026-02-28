import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { cardPaperSx } from '../constants'
import type { DashboardWeekEventItem } from '@/api/dashboard'

export interface WeekEventsBlockProps {
  events: DashboardWeekEventItem[]
  onEventClick: (leadId: string) => void
}

const WeekEventsBlock: React.FC<WeekEventsBlockProps> = ({ events, onEventClick }) => (
  <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
      <CalendarMonthIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
      События на неделю
    </Typography>
    {events.length > 0 ? (
      <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
        {events.slice(0, 10).map((ev) => (
          <Box
            key={`${ev.type}-${ev.id}`}
            component="li"
            sx={{
              py: 0.75,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': { color: '#a78bfa' },
            }}
            onClick={() => onEventClick(ev.leadId)}
          >
            {ev.type === 'reminder' ? (
              <NotificationsActiveIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
            ) : (
              <AssignmentIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: 'inherit' }}>{ev.title}</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                {ev.leadName ?? 'Лид'} · {ev.dateTime ? new Date(ev.dateTime).toLocaleString('ru-RU') : ev.date}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    ) : (
      <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет событий на эту неделю</Typography>
    )}
  </Paper>
)

export default WeekEventsBlock
