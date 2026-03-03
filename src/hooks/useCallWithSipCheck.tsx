import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { useAuth } from '@/auth/AuthProvider'

/**
 * Для менеджера и сотрудника при клике «Позвонить» проверяет, заполнен ли SIP в профиле.
 * Если нет — показывает модалку с ошибкой. Иначе открывает tel:/sip: ссылку.
 */
export function useCallWithSipCheck() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  const needsSipCheck = user?.role === 'manager' || user?.role === 'employee'
  const hasSip = Boolean((user as { sip?: string })?.sip?.trim())

  const callHref = (href: string) => {
    if (needsSipCheck && !hasSip) {
      setModalOpen(true)
      return
    }
    window.location.href = href
  }

  const SipErrorModal = (
    <Dialog open={modalOpen} onClose={() => setModalOpen(false)} PaperProps={{ sx: { bgcolor: 'background.paper', color: 'text.primary' } }}>
      <DialogTitle>SIP не подключена</DialogTitle>
      <DialogContent>
        Добавьте данные SIP в своём профиле, чтобы совершать звонки через MicroSIP.
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setModalOpen(false)}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  )

  return { callHref, SipErrorModal }
}
