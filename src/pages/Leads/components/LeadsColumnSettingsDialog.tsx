import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
} from '@mui/material'
import { LEADS_TABLE_COLUMN_LABELS } from './LeadsTable'
import type { LeadsTableColumnVisibility } from '@/api/users'

const COLUMN_KEYS = Object.keys(LEADS_TABLE_COLUMN_LABELS).filter((k) => k !== 'checkbox')

export interface LeadsColumnSettingsDialogProps {
  open: boolean
  onClose: () => void
  visibility: LeadsTableColumnVisibility
  onVisibilityChange: (visibility: LeadsTableColumnVisibility) => void
  onSave: (visibility: LeadsTableColumnVisibility) => void | Promise<void>
}

const LeadsColumnSettingsDialog: React.FC<LeadsColumnSettingsDialogProps> = ({
  open,
  onClose,
  visibility,
  onVisibilityChange,
  onSave,
}) => {
  const [draft, setDraft] = useState<LeadsTableColumnVisibility>(visibility)
  useEffect(() => {
    if (open) setDraft(visibility)
  }, [open, visibility])

  const handleToggle = (key: string, checked: boolean) => {
    setDraft((prev) => ({ ...prev, [key]: checked }))
  }

  const handleSave = async () => {
    onVisibilityChange(draft)
    await Promise.resolve(onSave(draft))
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper' } }}>
      <DialogTitle sx={{ color: 'rgba(255,255,255,0.9)' }}>Настройка столбцов</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.5 }}>
          {COLUMN_KEYS.map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={draft[key] !== false}
                  onChange={(_, checked) => handleToggle(key, checked)}
                  sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                />
              }
              label={LEADS_TABLE_COLUMN_LABELS[key] ?? key}
              sx={{ color: 'rgba(255,255,255,0.85)' }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ bgcolor: 'rgba(167,139,250,0.8)', '&:hover': { bgcolor: 'rgba(167,139,250,0.9)' } }}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LeadsColumnSettingsDialog
