import React, { useMemo, useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import { assigneeLabel } from '../constants'
import type { LeadStatsResult, LeadStatsByStatusRow } from '@/api/leads'

export interface StatisticsTableProps {
  stats: LeadStatsResult
}

type SortKey = 'assignee' | 'total' | string // string = statusId

function getRowValue(row: LeadStatsByStatusRow, sortKey: SortKey): string | number {
  if (sortKey === 'assignee') return assigneeLabel(row.assigneeName, row.isManager).toLowerCase()
  if (sortKey === 'total') return row.total
  const by = row.byStatus.find((b) => b.statusId === sortKey)
  return by?.count ?? 0
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({ stats }) => {
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const rows = Array.isArray(stats?.rows) ? stats.rows : []
  const statuses = Array.isArray(stats?.statuses) ? stats.statuses : []

  const totals = useMemo(() => {
    const byStatus = statuses.map((s) => ({
      statusId: s._id,
      count: rows.reduce((sum, r) => sum + (r.byStatus.find((b) => b.statusId === s._id)?.count ?? 0), 0),
    }))
    const total = rows.reduce((sum, r) => sum + r.total, 0)
    return { byStatus, total }
  }, [rows, statuses])

  const sortedRows = useMemo(() => {
    const key = sortKey
    const order = sortOrder
    return [...rows].sort((a, b) => {
      const va = getRowValue(a, key)
      const vb = getRowValue(b, key)
      const cmp = typeof va === 'string' && typeof vb === 'string' ? va.localeCompare(vb) : (va as number) - (vb as number)
      return order === 'asc' ? cmp : -cmp
    })
  }, [rows, sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder(key === 'assignee' ? 'asc' : 'desc')
    }
  }

  const cellSx = { color: 'rgba(255,255,255,0.7)', fontWeight: 600 }
  const headCellSx = { ...cellSx, whiteSpace: 'nowrap' }

  return (
    <TableContainer component={Paper} sx={{ bgcolor: 'rgba(18, 22, 36, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headCellSx}>
              <TableSortLabel
                active={sortKey === 'assignee'}
                direction={sortKey === 'assignee' ? sortOrder : 'asc'}
                onClick={() => handleSort('assignee')}
                sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-active': { color: 'rgba(167,139,250,0.95)' }, '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5)' } }}
              >
                Ответственный
              </TableSortLabel>
            </TableCell>
            {statuses.map((s) => (
              <TableCell key={s._id} align="right" sx={headCellSx}>
                <TableSortLabel
                  active={sortKey === s._id}
                  direction={sortKey === s._id ? sortOrder : 'desc'}
                  onClick={() => handleSort(s._id)}
                  sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-active': { color: 'rgba(167,139,250,0.95)' }, '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5)' } }}
                >
                  {s.name}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell align="right" sx={headCellSx}>
              <TableSortLabel
                active={sortKey === 'total'}
                direction={sortKey === 'total' ? sortOrder : 'desc'}
                onClick={() => handleSort('total')}
                sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-active': { color: 'rgba(167,139,250,0.95)' }, '& .MuiTableSortLabel-icon': { color: 'rgba(255,255,255,0.5)' } }}
              >
                Всего
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRows.map((r) => (
            <TableRow key={r.assigneeId}>
              <TableCell sx={{ color: 'rgba(255,255,255,0.9)' }}>{assigneeLabel(r.assigneeName, r.isManager)}</TableCell>
              {r.byStatus.map((b) => (
                <TableCell key={b.statusId} align="right" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {b.count}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                {r.total}
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}>
            <TableCell sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>Итого</TableCell>
            {totals.byStatus.map((t) => (
              <TableCell key={t.statusId} align="right" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
                {t.count}
              </TableCell>
            ))}
            <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
              {totals.total}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default StatisticsTable
