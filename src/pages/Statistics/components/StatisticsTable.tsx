import React from 'react'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { assigneeLabel } from '../constants'
import type { LeadStatsResult } from '@/api/leads'

export interface StatisticsTableProps {
  stats: LeadStatsResult
}

const StatisticsTable: React.FC<StatisticsTableProps> = ({ stats }) => (
  <TableContainer component={Paper} sx={{ bgcolor: 'rgba(18, 22, 36, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Ответственный</TableCell>
          {stats.statuses.map((s) => (
            <TableCell key={s._id} align="right" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.name}</TableCell>
          ))}
          <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Всего</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {stats.rows.map((r) => (
          <TableRow key={r.assigneeId}>
            <TableCell sx={{ color: 'rgba(255,255,255,0.9)' }}>{assigneeLabel(r.assigneeName, r.isManager)}</TableCell>
            {r.byStatus.map((b) => (
              <TableCell key={b.statusId} align="right" sx={{ color: 'rgba(255,255,255,0.9)' }}>{b.count}</TableCell>
            ))}
            <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>{r.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
)

export default StatisticsTable
