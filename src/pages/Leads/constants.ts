export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 500, 1000] as const

export const DATE_PICKER_POPPER_SX = {
  '& .MuiPaper-root': {
    minWidth: 360,
    p: 2,
    '& .MuiDayCalendar-monthContainer': { width: '100%' },
    '& .MuiPickersDay-root': { width: 48, height: 48, fontSize: '1.05rem' },
    '& .MuiPickersCalendarHeader-label': { fontSize: '1.25rem' },
    '& .MuiDayCalendar-weekDayLabel': { width: 48, height: 40, fontSize: '1rem' },
  },
} as const
