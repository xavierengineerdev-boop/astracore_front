import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface AppDialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  /** Блокировать закрытие при сохранении и т.п. */
  disableClose?: boolean
}

/**
 * Диалог в едином стиле приложения (тёмный фон, граница).
 * Переиспользуется на всех страницах вместо дублирования PaperProps/sx.
 */
const AppDialog: React.FC<AppDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  disableClose = false,
}) => (
  <Dialog
    open={open}
    onClose={disableClose ? undefined : onClose}
    maxWidth={maxWidth}
    fullWidth={fullWidth}
    PaperProps={{ sx: dialogPaperSx }}
  >
    <DialogTitle sx={dialogTitleSx}>{title}</DialogTitle>
    <DialogContent sx={{ pt: 2 }}>{children}</DialogContent>
    {actions && <DialogActions sx={{ px: 3, pb: 2 }}>{actions}</DialogActions>}
  </Dialog>
)

export default AppDialog
