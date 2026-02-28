import React from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface CommentDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}

const CommentDeleteDialog: React.FC<CommentDeleteDialogProps> = ({ open, onClose, onConfirm, deleting }) => (
  <Dialog open={open} onClose={deleting ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Удалить комментарий?</DialogTitle>
    <DialogContent>
      <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Действие нельзя отменить.</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={deleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>Отмена</Button>
      <Button variant="contained" onClick={onConfirm} disabled={deleting} sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}>
        {deleting ? 'Удаление…' : 'Удалить'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default CommentDeleteDialog
