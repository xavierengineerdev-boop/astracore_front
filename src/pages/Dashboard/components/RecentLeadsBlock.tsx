import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import { cardPaperSx } from '../constants'
import type { DashboardRecentLeadItem } from '@/api/dashboard'

export interface RecentLeadsBlockProps {
  leads: DashboardRecentLeadItem[]
  onLeadClick: (id: string) => void
}

const RecentLeadsBlock: React.FC<RecentLeadsBlockProps> = ({ leads, onLeadClick }) => (
  <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 240 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 1 }}>
      <ContactPageIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
      Недавние лиды
    </Typography>
    {leads.length > 0 ? (
      <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
        {leads.slice(0, 8).map((lead) => (
          <Box
            key={lead._id}
            component="li"
            sx={{
              py: 0.75,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              '&:hover': { color: '#a78bfa' },
            }}
            onClick={() => onLeadClick(lead._id)}
          >
            <Typography variant="body2" sx={{ color: 'inherit' }}>
              {[lead.name, lead.lastName].filter(Boolean).join(' ').trim() || '—'} · {lead.statusName}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">
              {lead.departmentName} · {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('ru-RU') : ''}
            </Typography>
          </Box>
        ))}
      </Box>
    ) : (
      <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет лидов</Typography>
    )}
  </Paper>
)

export default RecentLeadsBlock
