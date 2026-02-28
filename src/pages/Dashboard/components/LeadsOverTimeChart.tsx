import React from 'react'
import { Box, Typography, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { PERIOD_OPTIONS } from '../constants'
import { cardPaperSx } from '../constants'
import { LineTooltipContent } from './ChartTooltips'
import type { DashboardLeadsOverTimeItem } from '@/api/dashboard'

export interface LeadsOverTimeChartProps {
  leadsOverTimeRaw: DashboardLeadsOverTimeItem[]
  periodDays: number
  onPeriodChange: (days: number) => void
}

const LeadsOverTimeChart: React.FC<LeadsOverTimeChartProps> = ({
  leadsOverTimeRaw,
  periodDays,
  onPeriodChange,
}) => {
  const leadsOverTime =
    leadsOverTimeRaw.length <= periodDays ? leadsOverTimeRaw : leadsOverTimeRaw.slice(-periodDays)
  const trend =
    leadsOverTimeRaw.length >= periodDays * 2
      ? (() => {
          const prev = leadsOverTimeRaw.slice(0, periodDays).reduce((s, d) => s + d.count, 0)
          const curr = leadsOverTimeRaw.slice(-periodDays).reduce((s, d) => s + d.count, 0)
          return { current: curr, previous: prev, diff: curr - prev }
        })()
      : null
  const hasData = leadsOverTime.some((d) => d.count > 0)
  const chartData = leadsOverTime.map((d) => ({ date: d.date.slice(5), count: d.count }))

  return (
    <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 320 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
          Лиды за период
        </Typography>
        <ToggleButtonGroup
          value={periodDays}
          exclusive
          onChange={(_, v) => v != null && (PERIOD_OPTIONS as readonly number[]).includes(v) && onPeriodChange(v)}
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.7)',
              borderColor: 'rgba(255,255,255,0.15)',
              py: 0.5,
              px: 1.5,
              '&.Mui-selected': { bgcolor: 'rgba(167,139,250,0.2)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)' },
            },
          }}
        >
          {PERIOD_OPTIONS.map((d) => (
            <ToggleButton key={d} value={d} type="button">{d} дн.</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      {trend != null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {trend.diff > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#34d399' }}>
              <TrendingUpIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>+{trend.diff} к пред. периоду</Typography>
            </Box>
          )}
          {trend.diff < 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f87171' }}>
              <TrendingDownIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{trend.diff} к пред. периоду</Typography>
            </Box>
          )}
          {trend.diff === 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.5)' }}>
              <RemoveIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption">Без изменений</Typography>
            </Box>
          )}
        </Box>
      )}
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              stroke="rgba(255,255,255,0.2)"
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              stroke="rgba(255,255,255,0.2)"
              allowDecimals={false}
            />
            <Tooltip content={<LineTooltipContent />} />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
            <Line
              type="monotone"
              dataKey="count"
              name="Создано лидов"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={{ fill: '#a78bfa', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Нет данных за период
        </Box>
      )}
    </Paper>
  )
}

export default LeadsOverTimeChart
