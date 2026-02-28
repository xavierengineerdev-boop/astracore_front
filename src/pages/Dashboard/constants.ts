export const CHART_COLORS = ['#a78bfa', '#818cf8', '#6366f1', '#4f46e5', '#7c3aed', '#8b5cf6', '#c084fc', '#e879f9']

export const PERIOD_OPTIONS = [7, 14, 30] as const

export const cardPaperSx = {
  p: 2,
  bgcolor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2,
  height: '100%',
} as const

export function displayName(user: { firstName?: string; lastName?: string; email: string }): string {
  const first = (user.firstName ?? '').trim()
  const last = (user.lastName ?? '').trim()
  if (first || last) return [first, last].filter(Boolean).join(' ')
  return user.email
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}
