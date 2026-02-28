import React from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'
import type { StatusItem } from '@/api/statuses'

export interface LeadEditDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
  name: string
  onNameChange: (v: string) => void
  lastName: string
  onLastNameChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  phone2: string
  onPhone2Change: (v: string) => void
  email: string
  onEmailChange: (v: string) => void
  email2: string
  onEmail2Change: (v: string) => void
  statusId: string
  onStatusIdChange: (v: string) => void
  assignedTo: string[]
  onAssignedToChange: (v: string[]) => void
  statuses: StatusItem[]
  assigneeOptions: { id: string; label: string }[]
  assigneeNameMap: Record<string, string>
  isEmployee: boolean
  phoneDisabled?: boolean
  phone2Disabled?: boolean
  phoneHelperText?: string
  phone2HelperText?: string
}

const LeadEditDialog: React.FC<LeadEditDialogProps> = ({
  open,
  onClose,
  onSubmit,
  saving,
  name,
  onNameChange,
  lastName,
  onLastNameChange,
  phone,
  onPhoneChange,
  phone2,
  onPhone2Change,
  email,
  onEmailChange,
  email2,
  onEmail2Change,
  statusId,
  onStatusIdChange,
  assignedTo,
  onAssignedToChange,
  statuses,
  assigneeOptions,
  assigneeNameMap,
  isEmployee,
  phoneDisabled,
  phone2Disabled,
  phoneHelperText,
  phone2HelperText,
}) => (
  <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Редактировать лид</DialogTitle>
    <Box component="form" onSubmit={onSubmit}>
      <DialogContent sx={{ pt: 2 }}>
        <TextField required fullWidth label="Имя" value={name} onChange={(e) => onNameChange(e.target.value)} sx={{ mb: 2, ...formFieldSx }} />
        <TextField fullWidth label="Фамилия" value={lastName} onChange={(e) => onLastNameChange(e.target.value)} sx={{ mb: 2, ...formFieldSx }} />
        <TextField fullWidth label="Телефон" value={phone} onChange={(e) => onPhoneChange(e.target.value)} disabled={phoneDisabled} helperText={phoneHelperText} sx={{ mb: 2, ...formFieldSx }} />
        <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} sx={{ mb: 2, ...formFieldSx }} />
        <TextField fullWidth label="Телефон 2" value={phone2} onChange={(e) => onPhone2Change(e.target.value)} disabled={phone2Disabled} helperText={phone2HelperText} sx={{ mb: 2, ...formFieldSx }} />
        <TextField fullWidth label="Email 2" type="email" value={email2} onChange={(e) => onEmail2Change(e.target.value)} sx={{ mb: 2, ...formFieldSx }} />
        <TextField select fullWidth label="Статус" value={statusId} onChange={(e) => onStatusIdChange(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSx }}>
          <MenuItem value="">— Не выбран</MenuItem>
          {statuses.map((s) => (
            <MenuItem key={s._id} value={s._id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color || '#9ca3af', flexShrink: 0 }} />
                {s.name}
              </Box>
            </MenuItem>
          ))}
        </TextField>
        {assigneeOptions.length > 0 &&
          (isEmployee ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Обрабатывает</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                {assignedTo?.length ? assignedTo.map((id) => assigneeNameMap[id] || id).join(', ') : '— Никого'}
              </Typography>
            </Box>
          ) : (
            <TextField
              select
              SelectProps={{
                multiple: true,
                sx: { color: 'rgba(255,255,255,0.95)' },
                renderValue: (selected: unknown) =>
                  (selected as string[]).length ? (selected as string[]).map((id) => assigneeNameMap[id] || id).join(', ') : '— Никого',
              }}
              label="Обрабатывает"
              value={assignedTo}
              onChange={(e) => onAssignedToChange(Array.isArray(e.target.value) ? e.target.value : [])}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            >
              {assigneeOptions.map((o) => (
                <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
              ))}
            </TextField>
          ))}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>Отмена</Button>
        <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Box>
  </Dialog>
)

export default LeadEditDialog
