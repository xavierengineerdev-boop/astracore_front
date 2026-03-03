import React from 'react'
import { Box, Typography, Paper, Tooltip } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
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
  closerName: string
  onCopyPhone: () => void
  onCopyEmail: () => void
  onCopyPhone2?: () => void
  onCopyEmail2?: () => void
  /** При клике «Позвонить» — если передан, вызывается вместо перехода по href (для проверки SIP) */
  onCallClick?: (telHref: string) => void
}

const LeadInfoCard: React.FC<LeadInfoCardProps> = ({
  lead,
  departmentName,
  statusItem,
  assignedNames,
  closerName,
  onCopyPhone,
  onCopyEmail,
  onCopyPhone2,
  onCopyEmail2,
  onCallClick,
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
              const phone = (lead.phone ?? '').trim()
              const info = getPhoneCountryInfo(lead.phone ?? '')
              const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null
              return (
                <>
                  {info ? <span>{info.flag}</span> : null}
                  {telHref && (
                    <Tooltip title="Позвонить">
                      <Box
                        component="a"
                        href={telHref}
                        onClick={(e) => {
                          if (onCallClick) {
                            e.preventDefault()
                            onCallClick(telHref)
                          }
                        }}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: 'rgba(167,139,250,0.95)',
                          cursor: 'pointer',
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
              <CopyableText value={(lead.phone2 ?? '').trim()} onCopy={onCopyPhone2} sx={{ color: 'rgba(255,255,255,0.9)' }} />
              {(() => {
                const phone2 = (lead.phone2 ?? '').trim()
                const info = getPhoneCountryInfo(phone2)
                const telHref = phone2 ? `tel:${phone2.replace(/\s/g, '')}` : null
                return (
                  <>
                    {info ? <span>{info.flag}</span> : null}
                    {telHref && (
                      <Tooltip title="Позвонить">
                        <Box
                          component="a"
                          href={telHref}
                          onClick={(e) => {
                            if (onCallClick) {
                              e.preventDefault()
                              onCallClick(telHref)
                            }
                          }}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: 'rgba(167,139,250,0.95)',
                            cursor: 'pointer',
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
