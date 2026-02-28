import React from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface DeleteUserDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
  userEmail: string
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ open, onClose, onConfirm, deleting, userEmail }) => (
  <Dialog open={open} onClose={deleting ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Удалить пользователя?</DialogTitle>
    <DialogContent>
      <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{userEmail} — действие нельзя отменить.</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={deleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>Отмена</Button>
      <Button variant="contained" onClick={onConfirm} disabled={deleting} sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}>
        {deleting ? 'Удаление…' : 'Удалить'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default DeleteUserDialog
