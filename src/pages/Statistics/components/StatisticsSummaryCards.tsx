import React, { useMemo } from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import type { LeadStatsResult } from '@/api/leads'
import { CHART_COLORS } from '../constants'

export interface StatisticsSummaryCardsProps {
  stats: LeadStatsResult
}

const CARD_MIN = 120

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
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN}px, 1fr))`,
        gap: 2,
        mb: 3,
        maxWidth: '100%',
      }}
    >
      {/* Главная карточка — всего */}
      <Box
        sx={{
          gridColumn: { xs: '1 / -1', sm: 'span 1' },
          minHeight: 88,
          px: 2.5,
          py: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0.05) 100%)',
          border: '1px solid rgba(167,139,250,0.3)',
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
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Всего лидов
        </Typography>
      </Box>

      {/* Статусы — одинаковые карточки с тултипом по наведению */}
      {byStatus.map((s, i) => {
        const accent = CHART_COLORS[i % CHART_COLORS.length]
        return (
          <Tooltip key={s.statusId} title={s.statusName} placement="top" arrow enterDelay={300}>
            <Box
              sx={{
                minHeight: 88,
                minWidth: 0,
                px: 2,
                py: 1.75,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `4px solid ${accent}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: 'default',
              }}
            >
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '1.25rem' }}>
                {s.count}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.55)',
                  mt: 0.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {s.statusName}
              </Typography>
            </Box>
          </Tooltip>
        )
      })}
    </Box>
  )
}

export default StatisticsSummaryCards
