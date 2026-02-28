import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import { cardPaperSx } from '../constants'
import type { DashboardTopAssigneeItem } from '@/api/dashboard'

export interface TopAssigneesBlockProps {
  assignees: DashboardTopAssigneeItem[]
}

const TopAssigneesBlock: React.FC<TopAssigneesBlockProps> = ({ assignees }) => (
  <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
      <PeopleIcon sx={{ fontSize: 20, color: '#34d399' }} />
      Топ ответственных
    </Typography>
    {assignees.length > 0 ? (
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        {assignees.map((a) => (
          <Box key={a.assigneeId} component="li" sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {a.assigneeName} — {a.leadsCount} лидов
            </Typography>
          </Box>
        ))}
      </Box>
    ) : (
      <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет данных</Typography>
    )}
  </Paper>
)

export default TopAssigneesBlock
