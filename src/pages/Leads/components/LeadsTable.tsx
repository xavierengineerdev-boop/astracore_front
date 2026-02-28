import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CopyableText from '@/components/CopyableText'
import { getPhoneCountryInfo } from '@/utils/phoneCountry'
import { formatDateTime } from '../constants'
import { ROWS_PER_PAGE_OPTIONS } from '../constants'
import type { LeadItem } from '@/api/leads'
import type { StatusItem } from '@/api/statuses'

const headerCellSx = {
  color: 'rgba(255,255,255,0.6)',
  bgcolor: 'rgba(255,255,255,0.04)',
  verticalAlign: 'middle',
  py: 1,
} as const

export interface LeadsTableProps {
  leads: LeadItem[]
  loading: boolean
  total: number
  page: number
  rowsPerPage: number
  onPageChange: (_e: unknown, newPage: number) => void
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  statuses: StatusItem[]
  leadTagMap: Record<string, { name: string; color: string }>
  leadTagOptions: { id: string; name: string; color: string }[]
  onLeadTagChange: (leadId: string, leadTagId: string | null) => void
  assigneeOptions: { id: string; label: string }[]
  assigneeNameMap: Record<string, string>
  canBulkEdit: boolean
  canCreateLead: boolean
  isEmployee: boolean
  currentUserId?: string
  selectedLeadIds: string[]
  allSelectedOnPage: boolean
  someSelected: boolean
  onToggleSelectAll: () => void
  onToggleSelectLead: (id: string) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortUpdatedAt: () => void
  onStatusChange: (leadId: string, statusId: string) => void
  onAssignedToChange: (leadId: string, assignedTo: string[]) => void
  onEditLead: (lead: LeadItem) => void
  onDeleteLead: (leadId: string) => void
  updatingLeadId: string | null
  onLeadClick: (leadId: string) => void
  onCommentClick?: (lead: LeadItem) => void
  onCopyPhone: () => void
  onCopyEmail: () => void
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  loading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  statuses,
  leadTagMap,
  leadTagOptions,
  onLeadTagChange,
  assigneeOptions,
  assigneeNameMap,
  canBulkEdit,
  canCreateLead,
  isEmployee,
  currentUserId,
  selectedLeadIds,
  allSelectedOnPage,
  someSelected,
  onToggleSelectAll,
  onToggleSelectLead,
  sortBy,
  sortOrder,
  onSortUpdatedAt,
  onStatusChange,
  onAssignedToChange,
  onEditLead,
  onDeleteLead,
  updatingLeadId,
  onLeadClick,
  onCommentClick,
  onCopyPhone,
  onCopyEmail,
}) => {
  const colCount = 10 + (canBulkEdit ? 1 : 0) + (canCreateLead ? 1 : 0)
  const COMMENT_PREVIEW_LEN = 40

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <TableContainer
        component={Paper}
        sx={{
          flex: 1,
          minHeight: 0,
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 2,
          overflow: 'auto',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {canBulkEdit && (
                <TableCell padding="checkbox" sx={{ ...headerCellSx }}>
                  <Checkbox
                    indeterminate={someSelected && !allSelectedOnPage}
                    checked={allSelectedOnPage}
                    onChange={onToggleSelectAll}
                    sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                  />
                </TableCell>
              )}
              <TableCell sx={headerCellSx}>Имя</TableCell>
              <TableCell sx={headerCellSx}>Фамилия</TableCell>
              <TableCell sx={headerCellSx}>Телефон</TableCell>
              <TableCell sx={headerCellSx}>Email</TableCell>
              <TableCell sx={headerCellSx}>Статус</TableCell>
              <TableCell sx={headerCellSx}>Обрабатывает</TableCell>
              <TableCell sx={headerCellSx}>Источник</TableCell>
              <TableCell sx={headerCellSx}>Комментарий</TableCell>
              <TableCell sx={headerCellSx}>Создан</TableCell>
              <TableCell sx={{ ...headerCellSx, p: 0 }}>
                <Tooltip title={sortBy === 'updatedAt' ? (sortOrder === 'desc' ? 'Сначала новые (клик — по старым)' : 'Сначала старые (клик — по новым)') : 'Сортировка по дате изменения'}>
                  <Button
                    size="small"
                    endIcon={
                      sortBy === 'updatedAt' ? (
                        sortOrder === 'desc' ? (
                          <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                        )
                      ) : (
                        <ArrowDownwardIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                      )
                    }
                    onClick={onSortUpdatedAt}
                    sx={{
                      color: sortBy === 'updatedAt' ? 'rgba(167,139,250,0.95)' : 'rgba(255,255,255,0.6)',
                      textTransform: 'none',
                      minWidth: 0,
                      py: 0.5,
                      px: 1,
                    }}
                  >
                    Изменён
                  </Button>
                </Tooltip>
              </TableCell>
              {canCreateLead && (
                <TableCell sx={{ ...headerCellSx, width: 56 }} align="right" />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} sx={{ py: 2, textAlign: 'center' }}>
                  <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                  {canCreateLead ? 'Нет лидов. Нажмите «Добавить лид».' : 'Нет лидов.'}
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                  {canBulkEdit && (
                    <TableCell padding="checkbox" sx={{ verticalAlign: 'middle', py: 1 }}>
                      <Checkbox
                        checked={selectedLeadIds.includes(lead._id)}
                        onChange={() => onToggleSelectLead(lead._id)}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                      />
                    </TableCell>
                  )}
                  <TableCell
                    sx={{ color: 'rgba(255,255,255,0.95)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, verticalAlign: 'middle', py: 1 }}
                    onClick={() => onLeadClick(lead._id)}
                  >
                    {lead.name}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'middle', py: 1 }}>{lead.lastName || '—'}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'middle', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <CopyableText value={(lead.phone || lead.phone2 || '').trim()} onCopy={onCopyPhone} />
                      {(() => {
                        const info = getPhoneCountryInfo((lead.phone || lead.phone2 || '').trim())
                        return info ? <span>{info.flag}</span> : null
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'middle', py: 1 }}>
                    <CopyableText value={(lead.email || lead.email2 || '').trim()} onCopy={onCopyEmail} />
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'middle', py: 1 }}>
                    {canCreateLead ? (
                      <Select
                        size="small"
                        value={lead.statusId ?? ''}
                        onChange={(e) => onStatusChange(lead._id, e.target.value)}
                        disabled={updatingLeadId === lead._id}
                        displayEmpty
                        sx={{
                          minWidth: 140,
                          color: 'rgba(255,255,255,0.95)',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                          '& .MuiSelect-select': { py: 0.5 },
                        }}
                        renderValue={(v: unknown) => {
                          if (!v) return '— Не выбран'
                          const st = statuses.find((s) => s._id === v)
                          if (!st) return '—'
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: st.color || '#9ca3af', flexShrink: 0 }} />
                              <span>{st.name}</span>
                            </Box>
                          )
                        }}
                      >
                        <MenuItem value="">— Не выбран</MenuItem>
                        {statuses.map((s) => (
                          <MenuItem key={s._id} value={s._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color || '#9ca3af', flexShrink: 0 }} />
                              <span>{s.name}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    ) : lead.statusId ? (() => {
                      const st = statuses.find((s) => s._id === lead.statusId)
                      if (!st) return '—'
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: st.color || '#9ca3af', flexShrink: 0 }} />
                          <span>{st.name}</span>
                        </Box>
                      )
                    })() : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'middle', py: 1 }}>
                    {canCreateLead ? (
                      isEmployee ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {lead.assignedTo?.includes(currentUserId ?? '') ? 'На мне' : (lead.assignedTo?.length ? (lead.assignedTo.map((id) => assigneeNameMap[id] || id).join(', ')) : '— Никого')}
                        </Typography>
                      ) : (
                        <Select
                          size="small"
                          multiple
                          value={lead.assignedTo ?? []}
                          onChange={(e) => onAssignedToChange(lead._id, e.target.value as string[])}
                          disabled={updatingLeadId === lead._id}
                          displayEmpty
                          sx={{
                            minWidth: 140,
                            color: 'rgba(255,255,255,0.95)',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                            '& .MuiSelect-select': { py: 0.5 },
                          }}
                          renderValue={(selected) =>
                            (selected as string[]).length
                              ? (selected as string[]).map((id) => assigneeNameMap[id] || id).join(', ')
                              : '— Никого'
                          }
                        >
                          {assigneeOptions.map((o) => (
                            <MenuItem key={o.id} value={o.id}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      )
                    ) : lead.assignedTo?.length
                      ? (lead.assignedTo.map((id) => assigneeNameMap[id]).filter(Boolean).join(', ') || '—')
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'middle', py: 1 }}>
                    {canCreateLead ? (
                      <Select
                        size="small"
                        value={lead.leadTagId ?? ''}
                        onChange={(e) => onLeadTagChange(lead._id, e.target.value ? (e.target.value as string) : null)}
                        disabled={updatingLeadId === lead._id}
                        displayEmpty
                        sx={{
                          minWidth: 120,
                          color: 'rgba(255,255,255,0.95)',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                          '& .MuiSelect-select': { py: 0.5 },
                        }}
                        renderValue={(v: unknown) => {
                          if (!v) return '— Не выбран'
                          const tag = leadTagMap[v as string]
                          if (!tag) return '—'
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tag.color, flexShrink: 0 }} />
                              <span>{tag.name}</span>
                            </Box>
                          )
                        }}
                      >
                        <MenuItem value="">— Не выбран</MenuItem>
                        {leadTagOptions.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color, flexShrink: 0 }} />
                              <span>{t.name}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    ) : lead.leadTagId && leadTagMap[lead.leadTagId] ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: leadTagMap[lead.leadTagId].color, flexShrink: 0 }} />
                        <span>{leadTagMap[lead.leadTagId].name}</span>
                      </Box>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: lead.comment ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                      verticalAlign: 'middle',
                      py: 1,
                      maxWidth: 180,
                      cursor: onCommentClick ? 'pointer' : 'default',
                      '&:hover': onCommentClick ? { textDecoration: 'underline', bgcolor: 'rgba(255,255,255,0.04)' } : {},
                    }}
                    onClick={(e) => {
                      if (onCommentClick) {
                        e.stopPropagation()
                        onCommentClick(lead)
                      }
                    }}
                  >
                    {lead.comment?.trim() ? (
                      lead.comment.length > COMMENT_PREVIEW_LEN ? (
                        <Tooltip
                          title={
                            <Typography component="span" sx={{ whiteSpace: 'pre-wrap', display: 'block', maxWidth: 320 }}>
                              {lead.comment}
                            </Typography>
                          }
                          placement="top-start"
                          enterDelay={300}
                        >
                          <span>{lead.comment.slice(0, COMMENT_PREVIEW_LEN)}…</span>
                        </Tooltip>
                      ) : (
                        lead.comment
                      )
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', verticalAlign: 'middle', py: 1 }}>{formatDateTime(lead.createdAt)}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', verticalAlign: 'middle', py: 1 }}>{formatDateTime(lead.updatedAt)}</TableCell>
                  {canCreateLead && (
                    <TableCell align="right" sx={{ verticalAlign: 'middle', py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 0 }}>
                        <Tooltip title="Редактировать">
                          <IconButton size="small" onClick={() => onEditLead(lead)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" onClick={() => onDeleteLead(lead._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[...ROWS_PER_PAGE_OPTIONS]}
        labelRowsPerPage="Строк на странице:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`}
        sx={{
          flexShrink: 0,
          color: 'rgba(255,255,255,0.8)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          '& .MuiTablePagination-selectIcon': { color: 'rgba(255,255,255,0.8)' },
        }}
      />
    </Box>
  )
}

export default LeadsTable
