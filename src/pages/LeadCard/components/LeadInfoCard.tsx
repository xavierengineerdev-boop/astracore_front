import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import CopyableText from '@/components/CopyableText'
import { formatDateTime } from '../constants'
import { cardPaperSx } from '../constants'
import type { LeadItem } from '@/api/leads'
import { getPhoneCountryInfo } from '@/utils/phoneCountry'
import type { StatusItem } from '@/api/statuses'

export interface LeadInfoCardProps {
  lead: LeadItem
  departmentName: string | null
  statusItem: StatusItem | undefined
  assignedNames: string
  onCopyPhone: () => void
  onCopyEmail: () => void
  onCopyPhone2?: () => void
  onCopyEmail2?: () => void
}

const LeadInfoCard: React.FC<LeadInfoCardProps> = ({
  lead,
  departmentName,
  statusItem,
  assignedNames,
  onCopyPhone,
  onCopyEmail,
  onCopyPhone2,
  onCopyEmail2,
}) => {
  const fieldSx = { display: 'flex', flexDirection: 'column' as const, gap: 0.25 }
  return (
    <Paper sx={cardPaperSx}>
      <Box sx={{ display: 'grid', gap: 2, flex: 1, minHeight: 0 }}>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Имя</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)' }}>{lead.name}</Typography>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Фамилия</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)' }}>{lead.lastName || '—'}</Typography>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Телефон</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <CopyableText value={lead.phone ?? ''} onCopy={onCopyPhone} sx={{ color: 'rgba(255,255,255,0.9)' }} />
            {(() => {
              const info = getPhoneCountryInfo(lead.phone ?? '')
              return info ? <span>{info.flag}</span> : null
            })()}
          </Box>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Email</Typography>
          <CopyableText value={lead.email ?? ''} onCopy={onCopyEmail} sx={{ color: 'rgba(255,255,255,0.9)' }} />
        </Box>
        {(lead.phone2 ?? '').trim() ? (
          <Box sx={fieldSx}>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Телефон 2</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <CopyableText value={(lead.phone2 ?? '').trim()} onCopy={onCopyPhone2} sx={{ color: 'rgba(255,255,255,0.9)' }} />
              {(() => {
                const info = getPhoneCountryInfo((lead.phone2 ?? '').trim())
                return info ? <span>{info.flag}</span> : null
              })()}
            </Box>
          </Box>
        ) : null}
        {(lead.email2 ?? '').trim() ? (
          <Box sx={fieldSx}>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Email 2</Typography>
            <CopyableText value={(lead.email2 ?? '').trim()} onCopy={onCopyEmail2} sx={{ color: 'rgba(255,255,255,0.9)' }} />
          </Box>
        ) : null}
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Статус</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {statusItem ? (
              <>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: statusItem.color || '#9ca3af', flexShrink: 0 }} />
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{statusItem.name}</Typography>
              </>
            ) : (
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>—</Typography>
            )}
          </Box>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Обрабатывает</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{assignedNames}</Typography>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Отдел</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{departmentName ?? '—'}</Typography>
        </Box>
        {lead.source ? (
          <Box sx={fieldSx}>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Источник</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>{lead.source}</Typography>
          </Box>
        ) : null}
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Создан</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>{formatDateTime(lead.createdAt)}</Typography>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Обновлён</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>{formatDateTime(lead.updatedAt)}</Typography>
        </Box>
      </Box>
    </Paper>
  )
}

export default LeadInfoCard
