import React from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface CommentEditDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  content: string
  onContentChange: (v: string) => void
  saving: boolean
}

const CommentEditDialog: React.FC<CommentEditDialogProps> = ({ open, onClose, onSubmit, content, onContentChange, saving }) => (
  <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Редактировать комментарий</DialogTitle>
    <Box component="form" onSubmit={onSubmit}>
      <DialogContent sx={{ pt: 2 }}>
        <TextField fullWidth multiline minRows={3} label="Текст" value={content} onChange={(e) => onContentChange(e.target.value)} required sx={formFieldSx} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>Отмена</Button>
        <Button type="submit" variant="contained" disabled={saving || !content.trim()} sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Box>
  </Dialog>
)

export default CommentEditDialog
