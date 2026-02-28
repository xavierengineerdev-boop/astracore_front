import React from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface LeadCommentPopupProps {
  open: boolean
  onClose: () => void
  leadName?: string
  comment: string
  onCommentChange: (value: string) => void
  onSave: () => void
  saving: boolean
}

const LeadCommentPopup: React.FC<LeadCommentPopupProps> = ({
  open,
  onClose,
  leadName,
  comment,
  onCommentChange,
  onSave,
  saving,
}) => (
  <Dialog
    open={open}
    onClose={saving ? undefined : onClose}
    maxWidth="xs"
    fullWidth
    PaperProps={{ sx: dialogPaperSx }}
  >
    <DialogTitle sx={dialogTitleSx}>
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CommentOutlinedIcon sx={{ fontSize: 20 }} />
        Комментарий{leadName ? ` · ${leadName}` : ''}
      </Box>
    </DialogTitle>
    <DialogContent sx={{ pt: 1 }}>
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={4}
        placeholder="Добавить или изменить комментарий..."
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        sx={formFieldSx}
        autoFocus
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Отмена
      </Button>
      <Button
        variant="contained"
        onClick={onSave}
        disabled={saving}
        sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
      >
        {saving ? 'Сохранение…' : 'Сохранить'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default LeadCommentPopup
