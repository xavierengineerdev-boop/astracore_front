export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export const HISTORY_ACTION_LABELS: Record<string, string> = {
  created: 'Лид создан',
  updated: 'Данные изменены',
  status_changed: 'Статус изменён',
  assigned: 'Назначение изменено',
  note_added: 'Добавлена заметка',
  note_edited: 'Заметка отредактирована',
  note_deleted: 'Заметка удалена',
  comment_added: 'Добавлен комментарий',
  comment_edited: 'Комментарий отредактирован',
  comment_deleted: 'Комментарий удалён',
  task_added: 'Добавлена задача',
  task_updated: 'Задача изменена',
  task_deleted: 'Задача удалена',
  reminder_added: 'Добавлено напоминание',
  reminder_done: 'Напоминание выполнено',
  reminder_deleted: 'Напоминание удалено',
}

export const cardPaperSx = {
  p: 3,
  flex: { md: 1 },
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  bgcolor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2,
}

export const smallCardPaperSx = {
  p: 2.5,
  flex: '1 1 280px',
  minWidth: 0,
  maxWidth: { md: 400 },
  maxHeight: 360,
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  bgcolor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2,
}
