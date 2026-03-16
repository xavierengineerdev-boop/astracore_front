import React, { useMemo, useState } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS } from '../constants'
import type { LeadStatsResult } from '@/api/leads'

export interface StatisticsPieChartProps {
  stats: LeadStatsResult
}

function PieTooltip({ active, payload, total }: { active?: boolean; payload?: readonly { name: string; value: number }[]; total: number }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const pct = total > 0 ? Math.round((p.value / total) * 100) : 0
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'rgba(15,18,32,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 140,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
        {p.name}
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
        Лидов: <Box component="span" sx={{ color: '#a78bfa', fontWeight: 700 }}>{p.value}</Box> ({pct}%)
      </Typography>
    </Paper>
  )
}

const StatisticsPieChart: React.FC<StatisticsPieChartProps> = ({ stats }) => {
  const [activeIndex, setActiveIndex] = useState(-1)

  const { pieData, total } = useMemo(() => {
    const byStatus = stats.statuses.map((s) => ({
      name: s.name,
      value: stats.rows.reduce((sum, r) => sum + (r.byStatus.find((b) => b.statusId === s._id)?.count ?? 0), 0),
    }))
    const total = byStatus.reduce((s, i) => s + i.value, 0)
    const data = byStatus.filter((d) => d.value > 0)
    return { pieData: data, total }
  }, [stats])

  if (pieData.length === 0) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, minHeight: 280 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
          Лиды по статусам
        </Typography>
        <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Нет данных по статусам
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, minHeight: 280 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
        Лиды по статусам
      </Typography>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            {pieData.map((_, i) => {
              const base = CHART_COLORS[i % CHART_COLORS.length]
              const isActive = i === activeIndex
              return (
                <Cell
                  key={i}
                  fill={base}
                  stroke={isActive ? 'rgba(255,255,255,0.5)' : 'transparent'}
                  strokeWidth={isActive ? 2 : 0}
                  style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' : undefined }}
                />
              )
            })}
          </Pie>
          <Tooltip
            content={({ active, payload }) => (
              <PieTooltip active={active} payload={payload ? [...payload] : undefined} total={total} />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  )
}

export default StatisticsPieChart
