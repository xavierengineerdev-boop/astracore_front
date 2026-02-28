import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import type { SxProps, Theme } from '@mui/material'
import type { LeadStatsResult } from '@/api/leads'

export const formFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': { minHeight: 44 },
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function assigneeLabel(name: string, isManager: boolean): string {
  return isManager ? `${name} (Руководитель)` : `${name} (Сотрудник)`
}

export function exportStatsToCsv(stats: LeadStatsResult): void {
  const statusNames = stats.statuses.map((s) => s.name)
  const header = ['Ответственный', ...statusNames, 'Всего']
  const rows = stats.rows.map((r) => [
    assigneeLabel(r.assigneeName, r.isManager),
    ...r.byStatus.map((b) => String(b.count)),
    String(r.total),
  ])
  const lines = [header.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))]
  const csv = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `stats-${stats.departmentName.replace(/[^\w\s-]/g, '')}-${dayjs().format('YYYY-MM-DD')}.csv`)
}

export function exportStatsToXlsx(stats: LeadStatsResult): void {
  const statusNames = stats.statuses.map((s) => s.name)
  const header = ['Ответственный', ...statusNames, 'Всего']
  const rows = stats.rows.map((r) => [
    assigneeLabel(r.assigneeName, r.isManager),
    ...r.byStatus.map((b) => b.count),
    r.total,
  ])
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Статистика')
  XLSX.writeFile(wb, `stats-${stats.departmentName.replace(/[^\w\s-]/g, '')}-${dayjs().format('YYYY-MM-DD')}.xlsx`)
}
