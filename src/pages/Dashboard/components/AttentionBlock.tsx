import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { cardPaperSx } from '../constants'
import type { DashboardAttentionCounts } from '@/api/dashboard'

export interface AttentionBlockProps {
  counts: DashboardAttentionCounts | null
  onLeadsClick: () => void
}

const AttentionBlock: React.FC<AttentionBlockProps> = ({ counts, onLeadsClick }) => (
  <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
      <WarningAmberIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
      Требуют внимания
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          bgcolor: 'rgba(255,255,255,0.04)',
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
        }}
        onClick={onLeadsClick}
      >
        <Typography variant="body2" color="rgba(255,255,255,0.9)">Без статуса</Typography>
        <Typography variant="subtitle2" sx={{ color: '#fbbf24', fontWeight: 600 }}>{counts?.leadsWithoutStatus ?? 0}</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          bgcolor: 'rgba(255,255,255,0.04)',
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
        }}
        onClick={onLeadsClick}
      >
        <Typography variant="body2" color="rgba(255,255,255,0.9)">Без ответственного</Typography>
        <Typography variant="subtitle2" sx={{ color: '#fbbf24', fontWeight: 600 }}>{counts?.leadsUnassigned ?? 0}</Typography>
      </Box>
    </Box>
  </Paper>
)

export default AttentionBlock
