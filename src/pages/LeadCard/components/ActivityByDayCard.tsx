import React from 'react'
import { Box, Typography, Paper, Tooltip } from '@mui/material'
import { smallCardPaperSx } from '../constants'

export interface ActivityByDayCardProps {
  activityByDay: [string, number][]
}

const ActivityByDayCard: React.FC<ActivityByDayCardProps> = ({ activityByDay }) => (
  <Paper sx={smallCardPaperSx}>
    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontFamily: '"Orbitron", sans-serif', flexShrink: 0, fontSize: '1rem' }}>
      Активность по дням
    </Typography>
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      {activityByDay.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет данных</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.75,
            height: 100,
            px: 0.5,
            py: 1,
            borderRadius: 1.5,
            bgcolor: 'rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {activityByDay.map(([day, count]) => {
            const maxCount = Math.max(...activityByDay.map(([, c]) => c), 1)
            const h = Math.max(12, (count / maxCount) * 100)
            return (
              <Tooltip key={day} title={`${day}: ${count} ${count === 1 ? 'событие' : 'события'}`}>
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 28,
                      height: `${h}%`,
                      minHeight: 8,
                      borderRadius: '6px 6px 0 0',
                      background: 'linear-gradient(180deg, rgba(167,139,250,0.95) 0%, rgba(139,92,246,0.75) 100%)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'height 0.2s ease',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
                    {day}
                  </Typography>
                </Box>
              </Tooltip>
            )
          })}
        </Box>
      )}
    </Box>
  </Paper>
)

export default ActivityByDayCard
