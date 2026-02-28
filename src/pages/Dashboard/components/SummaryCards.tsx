import React from 'react'
import { Box, Typography, Paper, Avatar, Grid } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import { cardPaperSx } from '../constants'

export interface SummaryCardsProps {
  usersCount: number
  departmentsCount: number
  leadsCount: number
  onUsersClick: () => void
  onDepartmentsClick: () => void
  onLeadsClick: () => void
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  usersCount,
  departmentsCount,
  leadsCount,
  onUsersClick,
  onDepartmentsClick,
  onLeadsClick,
}) => (
  <Grid container spacing={2} sx={{ mb: 3 }}>
    <Grid size={{ xs: 12, sm: 4 }}>
      <Paper
        sx={{
          ...cardPaperSx,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          transition: 'background-color 0.2s, border-color 0.2s',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(167,139,250,0.25)' },
        }}
        onClick={onUsersClick}
      >
        <Avatar sx={{ bgcolor: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>
          <PeopleIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
            {usersCount}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.6)">Пользователей</Typography>
        </Box>
      </Paper>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <Paper
        sx={{
          ...cardPaperSx,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          transition: 'background-color 0.2s, border-color 0.2s',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(99,102,241,0.25)' },
        }}
        onClick={onDepartmentsClick}
      >
        <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
          <BusinessIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
            {departmentsCount}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.6)">Отделов</Typography>
        </Box>
      </Paper>
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <Paper
        sx={{
          ...cardPaperSx,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          transition: 'background-color 0.2s, border-color 0.2s',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(52,211,153,0.25)' },
        }}
        onClick={onLeadsClick}
      >
        <Avatar sx={{ bgcolor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
          <ContactPageIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
            {leadsCount}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.6)">Лидов</Typography>
        </Box>
      </Paper>
    </Grid>
  </Grid>
)

export default SummaryCards
