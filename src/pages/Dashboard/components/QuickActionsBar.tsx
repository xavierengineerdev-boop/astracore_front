import React from 'react'
import { Box, Typography, Paper, Button, alpha } from '@mui/material'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import BarChartIcon from '@mui/icons-material/BarChart'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'

export interface QuickActionsBarProps {
  departmentId?: string
  onNavigate: (path: string) => void
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ departmentId, onNavigate }) => (
  <Paper
    sx={{
      p: 2,
      mb: 3,
      bgcolor: alpha('#a78bfa', 0.06),
      border: '1px solid rgba(167,139,250,0.2)',
      borderRadius: 2,
    }}
  >
    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1.5, fontWeight: 600 }}>
      Быстрые действия
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ContactPageIcon />}
        onClick={() => onNavigate(departmentId ? `/leads?departmentId=${departmentId}` : '/leads')}
        sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
      >
        Лиды
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<BarChartIcon />}
        onClick={() => onNavigate('/statistics')}
        sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
      >
        Статистика
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PeopleIcon />}
        onClick={() => onNavigate('/users')}
        sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
      >
        Пользователи
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<BusinessIcon />}
        onClick={() => onNavigate('/departments')}
        sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.4)' }}
      >
        Отделы
      </Button>
    </Box>
  </Paper>
)

export default QuickActionsBar
