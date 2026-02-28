import React from 'react'
import { Box, Typography, Paper, Avatar, Link, Skeleton } from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import { cardPaperSx } from '../constants'
import type { DepartmentDetail } from '@/api/departments'

export interface DepartmentCardProps {
  department: DepartmentDetail | null
  loading: boolean
  onOpenDepartment: (id: string) => void
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, loading, onOpenDepartment }) => (
  <Paper sx={cardPaperSx}>
    {loading ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Skeleton width="40%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        </Box>
      </Box>
    ) : department ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.25)', color: '#818cf8', width: 48, height: 48 }}>
          <BusinessIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
            {department.name}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.6)">
            Сотрудников: {department.employeesCount} · Статусов: {department.statusesCount}
          </Typography>
          <Link
            component="button"
            variant="caption"
            sx={{ color: 'rgba(167,139,250,0.9)', cursor: 'pointer', mt: 0.5, display: 'inline-block' }}
            onClick={() => onOpenDepartment(department._id)}
          >
            Открыть отдел →
          </Link>
        </Box>
      </Box>
    ) : (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.06)', width: 48, height: 48 }}>
          <BusinessIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
        </Avatar>
        <Typography variant="body2" color="rgba(255,255,255,0.5)">
          Вы не привязаны к отделу
        </Typography>
      </Box>
    )}
  </Paper>
)

export default DepartmentCard
