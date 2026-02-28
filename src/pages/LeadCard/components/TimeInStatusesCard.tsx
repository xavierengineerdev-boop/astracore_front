import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { smallCardPaperSx } from '../constants'
import type { StatusItem } from '@/api/statuses'

export interface TimeInStatusesCardProps {
  timeInStatuses: { statusId: string | null; days: number }[]
  statuses: StatusItem[]
}

const TimeInStatusesCard: React.FC<TimeInStatusesCardProps> = ({ timeInStatuses, statuses }) => (
  <Paper sx={smallCardPaperSx}>
    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
      Время в статусах
    </Typography>
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      {timeInStatuses.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет данных</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {timeInStatuses.map(({ statusId, days }) => {
            const status = statusId ? statuses.find((s) => s._id === statusId) : null
            const totalDays = timeInStatuses.reduce((s, t) => s + t.days, 0)
            const pct = totalDays > 0 ? (days / totalDays) * 100 : 0
            const barColor = status?.color || '#a78bfa'
            return (
              <Box key={statusId ?? 'null'}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>
                    {status?.name ?? (statusId ? '—' : 'Без статуса')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                    {days} дн.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 10,
                    borderRadius: '10px',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                  }}
                >
                  <Box
                    sx={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: '10px',
                      bgcolor: barColor,
                      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  </Paper>
)

export default TimeInStatusesCard
