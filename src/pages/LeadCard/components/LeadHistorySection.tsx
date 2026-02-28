import React from 'react'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import { formatDateTime, HISTORY_ACTION_LABELS } from '../constants'
import type { LeadHistoryItem } from '@/api/leads'
import type { StatusItem } from '@/api/statuses'

export interface LeadHistorySectionProps {
  displayHistory: LeadHistoryItem[]
  loading: boolean
  statuses: StatusItem[]
  assigneeNameMap: Record<string, string>
}

const LeadHistorySection: React.FC<LeadHistorySectionProps> = ({
  displayHistory,
  loading,
  statuses,
  assigneeNameMap,
}) => {
  const statusName = (sid: string | null) => (sid ? statuses.find((s) => s._id === sid)?.name ?? sid : '—')

  const getDetail = (entry: LeadHistoryItem): string => {
    let detail = ''
    if (entry.action === 'status_changed' && entry.meta) {
      const m = entry.meta as { oldStatusId?: string; newStatusId?: string }
      detail = `${statusName(m.oldStatusId ?? null)} → ${statusName(m.newStatusId ?? null)}`
    }
    if (entry.action === 'assigned' && entry.meta) {
      const m = entry.meta as { oldAssignedTo?: string[]; newAssignedTo?: string[] }
      const oldNames = (m.oldAssignedTo ?? []).map((id) => assigneeNameMap[id] || id).join(', ') || '—'
      const newNames = (m.newAssignedTo ?? []).map((id) => assigneeNameMap[id] || id).join(', ') || '—'
      detail = `${oldNames} → ${newNames}`
    }
    if (entry.action === 'created' && entry.meta) {
      const m = entry.meta as { name?: string }
      if (m.name) detail = m.name
    }
    if (entry.action === 'updated' && entry.meta) {
      const m = entry.meta as Record<string, unknown>
      const parts = Object.entries(m)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => {
          const labels: Record<string, string> = { name: 'Имя', lastName: 'Фамилия', phone: 'Телефон', email: 'Email', comment: 'Комментарий' }
          return `${labels[k] ?? k}: ${String(v)}`
        })
      if (parts.length) detail = parts.join(' · ')
    }
    if ((entry.action === 'note_added' || entry.action === 'note_edited') && entry.meta) {
      const m = entry.meta as { content?: string }
      if (m.content) detail = m.content
    }
    if ((entry.action === 'comment_added' || entry.action === 'comment_edited') && entry.meta) {
      const m = entry.meta as { content?: string }
      if (m.content) detail = m.content
    }
    if ((entry.action === 'task_added' || entry.action === 'task_updated' || entry.action === 'task_deleted') && entry.meta) {
      const m = entry.meta as { title?: string; dueAt?: string | null; completed?: boolean }
      const parts: string[] = []
      if (m.title) parts.push(m.title)
      if (m.dueAt) parts.push(`до ${formatDateTime(m.dueAt)}`)
      if (entry.action === 'task_updated' && m.completed !== undefined) parts.push(m.completed ? 'выполнена' : 'в работе')
      if (parts.length) detail = parts.join(' · ')
    }
    if ((entry.action === 'reminder_added' || entry.action === 'reminder_done' || entry.action === 'reminder_deleted') && entry.meta) {
      const m = entry.meta as { title?: string; remindAt?: string }
      const parts: string[] = []
      if (m.title) parts.push(m.title)
      if (m.remindAt) parts.push(formatDateTime(m.remindAt))
      if (parts.length) detail = parts.join(' · ')
    }
    return detail
  }

  return (
    <Paper
      sx={{
        p: 3,
        mt: 3,
        width: '100%',
        boxSizing: 'border-box',
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 2, fontFamily: '"Orbitron", sans-serif' }}>
        История лида
      </Typography>
      {loading ? (
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : displayHistory.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет записей</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            ...(displayHistory.length > 5 && { maxHeight: 420, overflowY: 'auto', pr: 0.5 }),
          }}
        >
          {displayHistory.map((entry) => {
            const detail = getDetail(entry)
            return (
              <Box
                key={entry._id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  py: 1.5,
                  px: 2,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(167,139,250,0.9)', flexShrink: 0, mt: 0.75 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                    {HISTORY_ACTION_LABELS[entry.action] ?? entry.action}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', mt: 0.25 }}>
                    {entry.userDisplayName || assigneeNameMap[entry.userId] || entry.userId} · {formatDateTime(entry.createdAt)}
                  </Typography>
                  {detail ? (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.65)',
                        display: 'block',
                        mt: 0.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {detail}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Paper>
  )
}

export default LeadHistorySection
