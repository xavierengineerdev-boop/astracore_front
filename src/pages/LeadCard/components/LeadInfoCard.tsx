import React, { useState } from 'react'
import { Box, Typography, Paper, Tooltip, Select, MenuItem, FormControl } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import CopyableText from '@/components/CopyableText'
import { formatDateTime } from '../constants'
import { cardPaperSx } from '../constants'
import type { LeadItem } from '@/api/leads'
import { usePhoneRules } from '@/hooks/usePhoneRules'
import { getPhoneCountryInfo } from '@/utils/phoneCountry'
import { formatPhoneDisplay, getTelHref } from '@/utils/phone'
import type { StatusItem } from '@/api/statuses'

export interface LeadInfoCardProps {
  lead: LeadItem
  departmentName: string | null
  statusItem: StatusItem | undefined
  assignedNames: string
  closerName: string
  leadTagOptions?: { id: string; name: string; color: string }[]
  canEditLeadSource?: boolean
  onLeadTagChange?: (leadTagId: string | null) => void
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
  closerName,
  leadTagOptions = [],
  canEditLeadSource = false,
  onLeadTagChange,
  onCopyPhone,
  onCopyEmail,
  onCopyPhone2,
  onCopyEmail2,
}) => {
  const phoneRules = usePhoneRules()
  const [sourceSaving, setSourceSaving] = useState(false)
  const selectedTag = lead.leadTagId ? leadTagOptions.find((t) => t.id === lead.leadTagId) : null

  const handleSourceChange = async (leadTagId: string | null) => {
    if (!onLeadTagChange) return
    setSourceSaving(true)
    try {
      await onLeadTagChange(leadTagId)
    } finally {
      setSourceSaving(false)
    }
  }
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
            <CopyableText value={formatPhoneDisplay(lead.phone, phoneRules) || (lead.phone ?? '').trim()} onCopy={onCopyPhone} sx={{ color: 'rgba(255,255,255,0.9)' }} />
            {(() => {
              const phone = (lead.phone ?? '').trim()
              const info = getPhoneCountryInfo(lead.phone ?? '')
              const telHref = getTelHref(phone)
              return (
                <>
                  {info ? <span>{info.flag}</span> : null}
                  {telHref && (
                    <Tooltip title="Позвонить">
                      <Box
                        component="a"
                        href={telHref}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: 'rgba(167,139,250,0.95)',
                          '&:hover': { color: 'rgba(167,139,250,1)' },
                        }}
                      >
                        <PhoneIcon sx={{ fontSize: 20 }} />
                      </Box>
                    </Tooltip>
                  )}
                </>
              )
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
              <CopyableText value={formatPhoneDisplay(lead.phone2, phoneRules) || (lead.phone2 ?? '').trim()} onCopy={onCopyPhone2} sx={{ color: 'rgba(255,255,255,0.9)' }} />
              {(() => {
                const phone2 = (lead.phone2 ?? '').trim()
                const info = getPhoneCountryInfo(phone2)
                const telHref = getTelHref(phone2)
                return (
                  <>
                    {info ? <span>{info.flag}</span> : null}
                    {telHref && (
                      <Tooltip title="Позвонить">
                        <Box
                          component="a"
                          href={telHref}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: 'rgba(167,139,250,0.95)',
                            '&:hover': { color: 'rgba(167,139,250,1)' },
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 20 }} />
                        </Box>
                      </Tooltip>
                    )}
                  </>
                )
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
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Ответственный (клоузер)</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{closerName}</Typography>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Отдел</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{departmentName ?? '—'}</Typography>
        </Box>
        <Box sx={fieldSx}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">Источник</Typography>
          {canEditLeadSource && leadTagOptions.length > 0 ? (
            <FormControl size="small" fullWidth sx={{ mt: 0.5, minWidth: 160 }}>
              <Select
                value={lead.leadTagId ?? ''}
                displayEmpty
                disabled={sourceSaving}
                onChange={(e) => handleSourceChange(e.target.value === '' ? null : (e.target.value as string))}
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                }}
                renderValue={(v) => {
                  if (!v) return '— Не выбран'
                  const tag = leadTagOptions.find((t) => t.id === v)
                  return tag ? tag.name : v
                }}
              >
                <MenuItem value="">
                  <em>— Не выбран</em>
                </MenuItem>
                {leadTagOptions.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color, flexShrink: 0 }} />
                      {t.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedTag ? (
                <>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: selectedTag.color, flexShrink: 0 }} />
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{selectedTag.name}</Typography>
                </>
              ) : (
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>—</Typography>
              )}
            </Box>
          )}
        </Box>
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
