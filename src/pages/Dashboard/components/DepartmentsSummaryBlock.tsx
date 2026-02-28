import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import { cardPaperSx } from '../constants'
import type { DashboardDepartmentSummaryItem } from '@/api/dashboard'

export interface DepartmentsSummaryBlockProps {
  departments: DashboardDepartmentSummaryItem[]
  onDepartmentClick: (departmentId: string) => void
}

const DepartmentsSummaryBlock: React.FC<DepartmentsSummaryBlockProps> = ({ departments, onDepartmentClick }) => (
  <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
      <BusinessIcon sx={{ fontSize: 20, color: '#818cf8' }} />
      Сводка по отделам
    </Typography>
    {departments.length > 0 ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {departments.map((d) => (
          <Paper
            key={d.departmentId}
            elevation={0}
            sx={{
              p: 1.5,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 1.5,
              cursor: 'pointer',
              '&:hover': { borderColor: 'rgba(167,139,250,0.4)' },
            }}
            onClick={() => onDepartmentClick(d.departmentId)}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)' }}>{d.departmentName}</Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">{d.leadsCount} лидов</Typography>
          </Paper>
        ))}
      </Box>
    ) : (
      <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет отделов</Typography>
    )}
  </Paper>
)

export default DepartmentsSummaryBlock
