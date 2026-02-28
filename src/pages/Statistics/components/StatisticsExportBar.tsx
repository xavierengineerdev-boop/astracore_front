import React from 'react'
import { Box, Typography, Button, Stack } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import type { LeadStatsResult } from '@/api/leads'

export interface StatisticsExportBarProps {
  stats: LeadStatsResult
  canExport: boolean
  onExportCsv: () => void
  onExportXlsx: () => void
}

const StatisticsExportBar: React.FC<StatisticsExportBarProps> = ({
  stats,
  canExport,
  onExportCsv,
  onExportXlsx,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
    <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
      {stats.departmentName}
      {stats.filters && (stats.filters.dateFrom || stats.filters.dateTo || stats.filters.statusId) && (
        <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', ml: 1 }}>
          (с фильтрами)
        </Typography>
      )}
    </Typography>
    {canExport && (
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={onExportCsv}
          sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.5)' }}
        >
          Статистика CSV
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={onExportXlsx}
          sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.5)' }}
        >
          Статистика XLSX
        </Button>
      </Stack>
    )}
  </Box>
)

export default StatisticsExportBar
