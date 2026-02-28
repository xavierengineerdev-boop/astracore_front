import React, { useState } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS } from '../constants'
import { cardPaperSx } from '../constants'
import { PieTooltipContent } from './ChartTooltips'
import type { DashboardLeadsByStatusItem } from '@/api/dashboard'

export interface LeadsByStatusChartProps {
  data: DashboardLeadsByStatusItem[]
}

const LeadsByStatusChart: React.FC<LeadsByStatusChartProps> = ({ data }) => {
  const [activePieIndex, setActivePieIndex] = useState(-1)
  const total = data.reduce((s, i) => s + i.count, 0)
  const pieData = data.map((item) => ({ name: item.statusName, value: item.count }))

  return (
    <Paper sx={{ ...cardPaperSx, p: 2, minHeight: 320 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
        Лиды по статусам
      </Typography>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              onMouseEnter={(_, index) => setActivePieIndex(index)}
              onMouseLeave={() => setActivePieIndex(-1)}
            >
              {data.map((_, i) => {
                const base = CHART_COLORS[i % CHART_COLORS.length]
                const isActive = i === activePieIndex
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
                <PieTooltipContent active={active} payload={payload ? [...payload] : undefined} total={total} />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Нет данных по статусам
        </Box>
      )}
    </Paper>
  )
}

export default LeadsByStatusChart
