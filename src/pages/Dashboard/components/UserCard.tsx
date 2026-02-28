import React from 'react'
import { Box, Typography, Paper, Avatar, Link } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import { ROLE_LABELS } from '@/constants/roles'
import { cardPaperSx } from '../constants'
import type { displayName as displayNameFn } from '../constants'

export interface UserCardProps {
  user: { userId?: string; firstName?: string; lastName?: string; email: string; role?: string } | null
  displayName: typeof displayNameFn
  onOpenProfile: () => void
}

const UserCard: React.FC<UserCardProps> = ({ user, displayName: displayNameProp, onOpenProfile }) => (
  <Paper sx={cardPaperSx}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ bgcolor: 'rgba(167,139,250,0.3)', color: '#c4b5fd', width: 48, height: 48 }}>
        <PersonIcon />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
          {user ? displayNameProp(user) : '—'}
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.6)" noWrap>
          {user?.email ?? '—'}
        </Typography>
        <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mt: 0.5 }}>
          {user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : '—'}
        </Typography>
        <Link
          component="button"
          variant="caption"
          sx={{ color: 'rgba(167,139,250,0.9)', cursor: 'pointer', mt: 0.5, display: 'inline-block' }}
          onClick={onOpenProfile}
        >
          Открыть профиль →
        </Link>
      </Box>
    </Box>
  </Paper>
)

export default UserCard
