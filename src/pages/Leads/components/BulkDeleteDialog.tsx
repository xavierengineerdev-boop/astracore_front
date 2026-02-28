import React from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface BulkDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
  saving: boolean
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({ open, onClose, onConfirm, count, saving }) => (
  <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Удалить выбранные лиды?</DialogTitle>
    <DialogContent>
      <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
        Будет удалено лидов: <strong>{count}</strong>. Отменить действие нельзя.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Отмена
      </Button>
      <Button variant="contained" color="error" onClick={onConfirm} disabled={saving}>
        {saving ? 'Удаление…' : 'Удалить'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default BulkDeleteDialog
