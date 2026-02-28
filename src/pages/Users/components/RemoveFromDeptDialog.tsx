import React from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface RemoveFromDeptDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  removing: boolean
  userEmail: string
}

const RemoveFromDeptDialog: React.FC<RemoveFromDeptDialogProps> = ({ open, onClose, onConfirm, removing, userEmail }) => (
  <Dialog open={open} onClose={removing ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Удалить сотрудника из отдела?</DialogTitle>
    <DialogContent>
      <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{userEmail} будет убран из вашего отдела. Учётная запись останется.</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={removing} sx={{ color: 'rgba(255,255,255,0.7)' }}>Отмена</Button>
      <Button variant="contained" onClick={onConfirm} disabled={removing} sx={{ bgcolor: 'rgba(251,191,36,0.8)', color: '#000', '&:hover': { bgcolor: 'rgba(251,191,36,1)' } }}>
        {removing ? '…' : 'Удалить из отдела'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default RemoveFromDeptDialog
