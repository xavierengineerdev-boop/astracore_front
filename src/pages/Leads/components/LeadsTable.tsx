import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ClearIcon from '@mui/icons-material/Clear'
import PhoneIcon from '@mui/icons-material/Phone'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import CopyableText from '@/components/CopyableText'
import { usePhoneRules } from '@/hooks/usePhoneRules'
import { getPhoneCountryInfo } from '@/utils/phoneCountry'
import { formatPhoneDisplay, getTelHref } from '@/utils/phone'
import { formatDateTime } from '../constants'
import { ROWS_PER_PAGE_OPTIONS } from '../constants'
import type { LeadItem } from '@/api/leads'
import type { StatusItem } from '@/api/statuses'
import { getLeadsTableColumnWidths, saveLeadsTableColumnWidths, getLeadsTableColumnOrder, saveLeadsTableColumnOrder, type LeadsTableColumnWidths } from '@/api/users'

const MIN_COLUMN_WIDTH = 200
const CONTENT_EXTRA_PX = 20
const MIN_COLUMN_WIDTH_WITH_PADDING = MIN_COLUMN_WIDTH + CONTENT_EXTRA_PX

const LEADS_TABLE_COLUMN_CONFIG: { key: string; defaultWidth: number; minWidth: number }[] = [
  { key: 'checkbox', defaultWidth: 56, minWidth: 56 },
  { key: 'name', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'lastName', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'phone', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'email', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'status', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'assignedTo', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'closer', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'source', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'comment', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'createdAt', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'updatedAt', defaultWidth: MIN_COLUMN_WIDTH_WITH_PADDING, minWidth: MIN_COLUMN_WIDTH_WITH_PADDING },
  { key: 'actions', defaultWidth: 88, minWidth: 88 },
]

const COLUMN_DIVIDER = '1px solid rgba(255,255,255,0.12)'

const headerCellSx = {
  color: 'rgba(255,255,255,0.6)',
  bgcolor: 'rgba(255,255,255,0.04)',
  verticalAlign: 'middle',
  py: 0.75,
  px: 2,
  borderRight: COLUMN_DIVIDER,
} as const

const bodyCellSx = {
  verticalAlign: 'middle',
  py: 0.5,
  px: 2,
  overflow: 'hidden',
  boxSizing: 'border-box',
  minWidth: 0,
  maxWidth: '100%',
  borderRight: COLUMN_DIVIDER,
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
  onSortReset?: () => void
  onStatusChange: (leadId: string, statusId: string) => void
  onAssignedToChange: (leadId: string, assignedTo: string[]) => void
  onCloserChange: (leadId: string, closerId: string | null) => void
  onEditLead: (lead: LeadItem) => void
  onDeleteLead: (leadId: string) => void
  updatingLeadId: string | null
  getLeadUrl: (leadId: string) => string
  onCommentClick?: (lead: LeadItem) => void
  onCopyPhone: () => void
  onCopyEmail: () => void
  /** Видимость колонок: ключ — id колонки, значение — показывать (по умолчанию true при отсутствии ключа) */
  columnVisibility?: Record<string, boolean>
}

/** Список колонок и подписи для настройки видимости (экспорт для диалога настроек) */
export const LEADS_TABLE_COLUMN_LABELS: Record<string, string> = {
  checkbox: 'Чекбокс',
  name: 'Имя',
  lastName: 'Фамилия',
  phone: 'Телефон',
  email: 'Email',
  status: 'Статус',
  assignedTo: 'Обрабатывает',
  closer: 'Клоузер',
  source: 'Источник',
  comment: 'Комментарий',
  createdAt: 'Создан',
  updatedAt: 'Изменён',
  actions: 'Действия',
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
  onSortReset,
  onStatusChange,
  onAssignedToChange,
  onCloserChange,
  onEditLead,
  onDeleteLead,
  updatingLeadId,
  getLeadUrl,
  onCommentClick,
  onCopyPhone,
  onCopyEmail,
  columnVisibility,
}) => {
  const phoneRules = usePhoneRules()
  const COMMENT_PREVIEW_LEN = 40

  const defaultColumnOrder = React.useMemo(() => LEADS_TABLE_COLUMN_CONFIG.map((c) => c.key), [])
  const [columnOrder, setColumnOrder] = useState<string[]>(() => defaultColumnOrder)
  const orderSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getLeadsTableColumnOrder().then((saved) => {
      if (saved.length > 0) {
        const known = new Set(LEADS_TABLE_COLUMN_CONFIG.map((c) => c.key))
        const merged = [...saved.filter((k) => known.has(k))]
        defaultColumnOrder.forEach((k) => { if (!merged.includes(k)) merged.push(k) })
        setColumnOrder(merged)
      }
    }).catch(() => {})
  }, [])

  const visibleColumnKeys = React.useMemo(() => {
    return columnOrder.filter(
      (k) =>
        (k !== 'checkbox' || canBulkEdit) &&
        (k !== 'actions' || canCreateLead) &&
        (columnVisibility == null || columnVisibility[k] !== false),
    )
  }, [columnOrder, canBulkEdit, canCreateLead, columnVisibility])

  const defaultWidths = React.useMemo(() => {
    const out: LeadsTableColumnWidths = {}
    LEADS_TABLE_COLUMN_CONFIG.forEach((c) => { out[c.key] = c.defaultWidth })
    return out
  }, [])

  const [columnWidths, setColumnWidths] = useState<LeadsTableColumnWidths>(() => ({}))
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [resizingCol, setResizingCol] = useState<string | null>(null)
  const hasCustomWidths = Object.keys(columnWidths).length > 0

  useEffect(() => {
    getLeadsTableColumnWidths().then((saved) => {
      if (Object.keys(saved).length > 0) {
        setColumnWidths((prev) => {
          const next = { ...defaultWidths, ...prev }
          LEADS_TABLE_COLUMN_CONFIG.forEach((c) => {
            const v = saved[c.key]
            if (typeof v === 'number' && v >= c.minWidth) next[c.key] = v
          })
          return next
        })
      }
    }).catch(() => {})
  }, [])

  const scheduleSave = useCallback((widths: LeadsTableColumnWidths) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null
      saveLeadsTableColumnWidths(widths).catch(() => {})
    }, 500)
  }, [])

  useEffect(() => () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    if (orderSaveTimeoutRef.current) clearTimeout(orderSaveTimeoutRef.current)
  }, [])

  const getWidth = useCallback((key: string) => {
    const config = LEADS_TABLE_COLUMN_CONFIG.find((c) => c.key === key)
    const w = columnWidths[key]
    if (typeof w === 'number' && config && w >= config.minWidth) return w
    return config?.defaultWidth ?? MIN_COLUMN_WIDTH
  }, [columnWidths])

  const resizeStartWRef = useRef<number>(0)
  const handleResizeStart = useCallback((colKey: string, startX: number) => {
    const config = LEADS_TABLE_COLUMN_CONFIG.find((c) => c.key === colKey)
    if (!config) return
    resizeStartWRef.current = getWidth(colKey)
    setResizingCol(colKey)
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      setColumnWidths((prev) => {
        const next = { ...defaultWidths, ...prev }
        const newW = Math.max(config.minWidth, resizeStartWRef.current + delta)
        next[colKey] = newW
        scheduleSave(next)
        return next
      })
    }
    const onUp = () => {
      setResizingCol(null)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [getWidth, scheduleSave, defaultWidths])

  const colCount = visibleColumnKeys.length

  const getMinWidth = useCallback((key: string) => {
    const config = LEADS_TABLE_COLUMN_CONFIG.find((c) => c.key === key)
    return config?.minWidth ?? MIN_COLUMN_WIDTH
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = visibleColumnKeys.indexOf(String(active.id))
    const newIndex = visibleColumnKeys.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const newVisibleOrder = arrayMove(visibleColumnKeys, oldIndex, newIndex)
    const visibleSet = new Set(newVisibleOrder)
    let vi = 0
    const newFullOrder = columnOrder.map((k) => {
      if (visibleSet.has(k)) return newVisibleOrder[vi++]
      return k
    })
    setColumnOrder(newFullOrder)
    if (orderSaveTimeoutRef.current) clearTimeout(orderSaveTimeoutRef.current)
    orderSaveTimeoutRef.current = setTimeout(() => {
      saveLeadsTableColumnOrder(newFullOrder).catch(() => {})
      orderSaveTimeoutRef.current = null
    }, 300)
  }, [columnOrder, visibleColumnKeys])

  const ResizableHeaderCell: React.FC<{
    colKey: string
    children: React.ReactNode
    sx?: Record<string, unknown>
    noResize?: boolean
    draggable?: boolean
    sortableRef?: (node: HTMLElement | null) => void
    sortableStyle?: React.CSSProperties
    handleListeners?: Record<string, unknown>
    handleAttributes?: Record<string, unknown>
  }> = ({ colKey, children, sx = {}, noResize, draggable: isDraggable, sortableRef, sortableStyle, handleListeners, handleAttributes }) => {
    const w = hasCustomWidths ? getWidth(colKey) : undefined
    const minW = getMinWidth(colKey)
    const isResizing = resizingCol === colKey
    return (
      <TableCell
        component="th"
        ref={sortableRef}
        style={sortableStyle}
        sx={{
          ...headerCellSx,
          ...sx,
          ...(w != null ? { width: w, minWidth: w, maxWidth: w } : { minWidth: minW }),
          position: 'relative',
          boxSizing: 'border-box',
          borderRight: isResizing ? '2px solid rgba(167,139,250,0.9)' : COLUMN_DIVIDER,
        }}
        title={isDraggable ? 'Перетащите за иконку для изменения порядка колонки' : undefined}
      >
        <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isDraggable && (
            <Box
              component="div"
              {...(handleListeners as object)}
              {...(handleAttributes as object)}
              sx={{
                cursor: 'grab',
                display: 'inline-flex',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.5)',
                p: 0.25,
                mx: -0.25,
                borderRadius: 1,
                userSelect: 'none',
                '&:active': { cursor: 'grabbing' },
                '&:hover': { color: 'rgba(255,255,255,0.9)', bgcolor: 'rgba(255,255,255,0.08)' },
                '& svg': { pointerEvents: 'none', display: 'block' },
              }}
              title="Перетащите для изменения порядка колонки"
            >
              <DragIndicatorIcon sx={{ fontSize: 20 }} />
            </Box>
          )}
          {children}
          {!noResize && (
            <Box
              component="span"
              onMouseDown={(e) => { e.preventDefault(); handleResizeStart(colKey, e.clientX) }}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 12,
                height: '100%',
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                '&::after': {
                  content: '""',
                  width: 3,
                  flexShrink: 0,
                  bgcolor: 'rgba(255,255,255,0.4)',
                  transition: 'background-color 0.15s',
                },
                '&:hover': {
                  '&::after': { bgcolor: 'rgba(167,139,250,0.9)' },
                },
                '&:active::after': { bgcolor: 'rgba(167,139,250,1)' },
              }}
              aria-label="Изменить ширину колонки"
            />
          )}
        </Box>
      </TableCell>
    )
  }

  const SortableHeaderCell: React.FC<{
    colKey: string
    children: React.ReactNode
    sx?: Record<string, unknown>
    noResize?: boolean
  }> = (props) => {
    const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({ id: props.colKey })
    return (
      <ResizableHeaderCell
        {...props}
        draggable
        sortableRef={setNodeRef}
        sortableStyle={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.6 : 1,
        }}
        handleListeners={listeners as unknown as Record<string, unknown>}
        handleAttributes={attributes as unknown as Record<string, unknown>}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
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
        <Table
          size="small"
          stickyHeader
          sx={{
            tableLayout: hasCustomWidths ? 'fixed' : 'auto',
            ...(hasCustomWidths ? { minWidth: visibleColumnKeys.reduce((s, k) => s + getWidth(k), 0) } : {}),
            '& th:last-of-type, & td:last-of-type': { borderRight: 'none' },
          }}
        >
          <colgroup>
            {visibleColumnKeys.map((key) =>
              hasCustomWidths ? (
                <col key={key} style={{ width: getWidth(key), minWidth: getWidth(key) }} />
              ) : (
                <col key={key} style={{ minWidth: getMinWidth(key) }} />
              ),
            )}
          </colgroup>
          <TableHead>
            <TableRow>
              <SortableContext items={visibleColumnKeys} strategy={horizontalListSortingStrategy}>
              {visibleColumnKeys.map((key) => {
                const headerContent = (() => {
                  if (key === 'checkbox') return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <Checkbox
                        indeterminate={someSelected && !allSelectedOnPage}
                        checked={allSelectedOnPage}
                        onChange={onToggleSelectAll}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                      />
                    </Box>
                  )
                  if (key === 'name') return 'Имя'
                  if (key === 'lastName') return 'Фамилия'
                  if (key === 'phone') return 'Телефон'
                  if (key === 'email') return 'Email'
                  if (key === 'status') return 'Статус'
                  if (key === 'assignedTo') return 'Обрабатывает'
                  if (key === 'closer') return 'Клоузер'
                  if (key === 'source') return 'Источник'
                  if (key === 'comment') return 'Комментарий'
                  if (key === 'createdAt') return 'Создан'
                  if (key === 'updatedAt') return (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
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
                      {sortBy === 'updatedAt' && onSortReset && (
                        <Tooltip title="Сбросить сортировку (по дате создания)">
                          <IconButton
                            size="small"
                            onClick={onSortReset}
                            sx={{ color: 'rgba(255,255,255,0.5)', p: 0.25, '&:hover': { color: 'rgba(255,255,255,0.9)' } }}
                          >
                            <ClearIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )
                  if (key === 'actions') return <span />
                  return key
                })()
                if (key === 'checkbox' || key === 'actions') {
                  return (
                    <ResizableHeaderCell
                      key={key}
                      colKey={key}
                      noResize
                      sx={key === 'checkbox' ? { px: 2 } : {}}
                      draggable={false}
                    >
                      {headerContent}
                    </ResizableHeaderCell>
                  )
                }
                return (
                  <SortableHeaderCell
                    key={key}
                    colKey={key}
                    noResize={false}
                    sx={key === 'updatedAt' ? { p: 0, whiteSpace: 'nowrap' } : {}}
                  >
                    {headerContent}
                  </SortableHeaderCell>
                )
              })}
              </SortableContext>
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
                  {visibleColumnKeys.map((colKey) => {
                    if (colKey === 'checkbox') return (
                      <TableCell key={colKey} padding="checkbox" align="center" sx={bodyCellSx}>
                        <Checkbox
                          checked={selectedLeadIds.includes(lead._id)}
                          onChange={() => onToggleSelectLead(lead._id)}
                          sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                        />
                      </TableCell>
                    )
                    if (colKey === 'name') return (
                      <TableCell key={colKey} sx={bodyCellSx}>
                    <Box
                      component="a"
                      href={getLeadUrl(lead._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: 'block',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'rgba(255,255,255,0.95)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                        '&:hover': { color: 'rgba(167,139,250,0.95)' },
                      }}
                    >
                      {lead.name}
                        </Box>
                      </TableCell>
                    )
                    if (colKey === 'lastName') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.lastName || '—'}</TableCell>
                    )
                    if (colKey === 'phone') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.8)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden' }}>
                      <CopyableText value={formatPhoneDisplay(lead.phone || lead.phone2, phoneRules) || (lead.phone || lead.phone2 || '').trim()} onCopy={onCopyPhone} />
                      {(() => {
                        const ph = (lead.phone || lead.phone2 || '').trim()
                        const info = getPhoneCountryInfo(ph)
                        const telHref = getTelHref(ph)
                        return (
                          <>
                            {info ? <span>{info.flag}</span> : null}
                            {telHref && (
                              <Tooltip title="Позвонить">
                                <Box
                                  component="a"
                                  href={telHref}
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: 'rgba(167,139,250,0.9)',
                                    '&:hover': { color: 'rgba(167,139,250,1)' },
                                  }}
                                >
                                  <PhoneIcon sx={{ fontSize: 18 }} />
                                </Box>
                              </Tooltip>
                            )}
                          </>
                        )
                      })()}
                        </Box>
                      </TableCell>
                    )
                    if (colKey === 'email') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.8)' }}>
                        <CopyableText value={(lead.email || lead.email2 || '').trim()} onCopy={onCopyEmail} />
                      </TableCell>
                    )
                    if (colKey === 'status') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.8)' }}>
                    {canCreateLead ? (
                      <Select
                        size="small"
                        value={lead.statusId ?? ''}
                        onChange={(e) => onStatusChange(lead._id, e.target.value)}
                        disabled={updatingLeadId === lead._id}
                        displayEmpty
                        sx={{
                          minWidth: 0,
                          maxWidth: '100%',
                          width: '100%',
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
                    )
                    if (colKey === 'assignedTo') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.8)' }}>
                        {canCreateLead ? (
                      isEmployee ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                            minWidth: 0,
                            maxWidth: '100%',
                            width: '100%',
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
                    )
                    if (colKey === 'closer') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.8)' }}>
                        {canCreateLead ? (
                      <Select
                        size="small"
                        value={lead.closerId ?? ''}
                        onChange={(e) => onCloserChange(lead._id, e.target.value ? (e.target.value as string) : null)}
                        disabled={updatingLeadId === lead._id}
                        displayEmpty
                        sx={{
                          minWidth: 0,
                          maxWidth: '100%',
                          width: '100%',
                          color: 'rgba(255,255,255,0.95)',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                          '& .MuiSelect-select': { py: 0.5 },
                        }}
                        renderValue={(v: unknown) => (v ? (assigneeNameMap[v as string] || (v as string)) : '— Не выбран')}
                      >
                        <MenuItem value="">— Не выбран</MenuItem>
                        {assigneeOptions.map((o) => (
                          <MenuItem key={o.id} value={o.id}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : lead.closerId ? (assigneeNameMap[lead.closerId] || lead.closerId) : '—'}
                      </TableCell>
                    )
                    if (colKey === 'source') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.8)' }}>
                        {canCreateLead ? (
                      <Select
                        size="small"
                        value={lead.leadTagId ?? ''}
                        onChange={(e) => onLeadTagChange(lead._id, e.target.value ? (e.target.value as string) : null)}
                        disabled={updatingLeadId === lead._id}
                        displayEmpty
                        sx={{
                          minWidth: 0,
                          maxWidth: '100%',
                          width: '100%',
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
                    )
                    if (colKey === 'comment') return (
                      <TableCell
                        key={colKey}
                        sx={{
                          ...bodyCellSx,
                          color: lead.comment ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
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
                    {(() => {
                      const list =
                        lead.comments && lead.comments.length > 0
                          ? lead.comments
                          : lead.lastComment
                            ? [lead.lastComment]
                            : (lead.comment ?? '').trim()
                              ? [{ content: (lead.comment ?? '').trim(), createdAt: '' }]
                              : []
                      const lastOne = list.length > 0 ? list[list.length - 1] : null
                      const text = lastOne ? lastOne.content.trim() : ''
                      return text ? (
                        text.length > COMMENT_PREVIEW_LEN ? (
                          <Tooltip
                            title={
                              <Typography component="span" sx={{ whiteSpace: 'pre-wrap', display: 'block', maxWidth: 360 }}>
                                {list.map((c, i) => (c.content.trim() ? `${i + 1}. ${c.content.trim()}` : null)).filter(Boolean).join('\n\n') || text}
                              </Typography>
                            }
                            placement="top-start"
                            enterDelay={300}
                          >
                            <Box component="span" sx={{ display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text.slice(0, COMMENT_PREVIEW_LEN)}…</Box>
                          </Tooltip>
                        ) : (
                          <Box component="span" sx={{ display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</Box>
                        )
                      ) : (
                        '—'
                      )
                    })()}
                      </TableCell>
                    )
                    if (colKey === 'createdAt') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{formatDateTime(lead.createdAt)}</TableCell>
                    )
                    if (colKey === 'updatedAt') return (
                      <TableCell key={colKey} sx={{ ...bodyCellSx, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{formatDateTime(lead.updatedAt)}</TableCell>
                    )
                    if (colKey === 'actions') return (
                      <TableCell key={colKey} align="right" sx={bodyCellSx}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
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
                    )
                    return null
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </DndContext>

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
