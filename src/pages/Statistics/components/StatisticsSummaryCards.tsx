import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import type { LeadStatsResult } from '@/api/leads'
import { CHART_COLORS } from '../constants'

export interface StatisticsSummaryCardsProps {
  stats: LeadStatsResult
}

const StatisticsSummaryCards: React.FC<StatisticsSummaryCardsProps> = ({ stats }) => {
  const { totalLeads, byStatus } = useMemo(() => {
    const total = stats.rows.reduce((sum, r) => sum + r.total, 0)
    const byStatusList = stats.statuses.map((s) => ({
      statusId: s._id,
      statusName: s.name,
      count: stats.rows.reduce((sum, r) => sum + (r.byStatus.find((b) => b.statusId === s._id)?.count ?? 0), 0),
    }))
    return { totalLeads: total, byStatus: byStatusList }
  }, [stats])

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 2,
        alignItems: 'stretch',
        // не даём блокам вылезать за экран: перенос и минимальная ширина по брейкпоинтам
        '& > *': { minWidth: 0 },
      }}
    >
      {/* Главная карточка — всего */}
      <Box
        sx={{
          minWidth: { xs: 100, sm: 140 },
          flex: '0 1 auto',
          px: { xs: 2, sm: 2.5 },
          py: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
          border: '1px solid rgba(167,139,250,0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ color: 'rgba(255,255,255,0.98)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {totalLeads}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Всего лидов
        </Typography>
      </Box>

      {/* Статусы — компактные полоски с цветным акцентом, переносятся при нехватке места */}
      {byStatus.map((s, i) => {
        const accent = CHART_COLORS[i % CHART_COLORS.length]
        return (
          <Box
            key={s.statusId}
            sx={{
              minWidth: { xs: 80, sm: 100 },
              flex: '1 1 100px',
              maxWidth: { xs: 'none', sm: 160 },
              pl: 1.5,
              pr: 2,
              py: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `3px solid ${accent}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '1.25rem' }}>
              {s.count}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                mt: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.statusName}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

export default StatisticsSummaryCards
