import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import type { LeadItem } from '@/api/leads'

export interface SourceMetaBlockProps {
  lead: LeadItem
}

const SourceMetaBlock: React.FC<SourceMetaBlockProps> = ({ lead }) => {
  const sm = lead.sourceMeta
  const allRows: { label: string; value: string | undefined }[] = [
    { label: 'IP', value: sm?.ip },
    { label: 'User-Agent', value: sm?.userAgent },
    { label: 'Referrer', value: sm?.referrer },
    { label: 'Экран', value: sm?.screen },
    { label: 'Язык', value: sm?.language },
    { label: 'Платформа', value: sm?.platform },
    { label: 'Часовой пояс', value: sm?.timezone },
    { label: 'Память (GB)', value: sm?.deviceMemory },
    { label: 'Ядра CPU', value: sm?.hardwareConcurrency },
  ]
  if (sm?.extra && typeof sm.extra === 'object') {
    Object.entries(sm.extra).forEach(([k, v]) => {
      allRows.push({ label: k, value: v != null ? String(v) : undefined })
    })
  }

  const rows = allRows.filter((r) => r.value != null && String(r.value).trim() !== '')
  if (rows.length === 0) return null

  return (
    <Paper
      sx={{
        p: 3,
        mt: 3,
        maxWidth: 720,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 2, fontFamily: '"Orbitron", sans-serif' }}>
        Дополнительная информация
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {rows.map((r, idx) => (
          <Box key={`${r.label}-${idx}`}>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">{r.label}</Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                wordBreak: 'break-word',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {r.value!.trim()}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default SourceMetaBlock
