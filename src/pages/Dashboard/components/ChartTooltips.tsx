import { Box, Typography, Paper } from '@mui/material'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import BarChartIcon from '@mui/icons-material/BarChart'
import type { TooltipProps } from 'recharts'

export function PieTooltipContent({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ name: string; value: number }>
  total: number
}) {
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <ContactPageIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600, fontSize: '0.95rem' }}>
          {p.name}
        </Typography>
      </Box>
      <Typography component="span" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
        Лидов:{' '}
      </Typography>
      <Typography component="span" sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem' }}>
        {p.value}
      </Typography>
      <Typography component="span" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', ml: 0.5 }}>
        ({pct}%)
      </Typography>
    </Paper>
  )
}

type LineTooltipProps = TooltipProps<number, string> & { payload?: Array<{ value?: number }>; label?: string }

export function LineTooltipContent(props: LineTooltipProps) {
  const { active, payload, label } = props
  if (!active || !payload?.length) return null
  const value = payload[0].value ?? 0
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'rgba(15,18,32,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 120,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <BarChartIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.9rem' }}>
          {label != null ? `Дата: ${String(label)}` : ''}
        </Typography>
      </Box>
      <Typography component="span" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
        Создано лидов:{' '}
      </Typography>
      <Typography component="span" sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem' }}>
        {value}
      </Typography>
    </Paper>
  )
}
