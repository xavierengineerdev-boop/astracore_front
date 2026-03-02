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
  FormControl,
  InputLabel,
  Select,
  Typography,
} from '@mui/material'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'
import type { StatusItem } from '@/api/statuses'

export interface BulkEditDialogProps {
  open: boolean
  onClose: () => void
  onApply: () => void
  saving: boolean
  selectedCount: number
  statusId: string
  onStatusIdChange: (v: string) => void
  leadTagId: string
  onLeadTagIdChange: (v: string) => void
  leadTagOptions: { id: string; name: string; color: string }[]
  closerId: string
  onCloserIdChange: (v: string) => void
  assignedTo: string[]
  onAssignedToChange: (v: string[]) => void
  statuses: StatusItem[]
  assigneeOptions: { id: string; label: string }[]
  assigneeNameMap: Record<string, string>
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  open,
  onClose,
  onApply,
  saving,
  selectedCount,
  statusId,
  onStatusIdChange,
  leadTagId,
  onLeadTagIdChange,
  leadTagOptions,
  closerId,
  onCloserIdChange,
  assignedTo,
  onAssignedToChange,
  statuses,
  assigneeOptions,
  assigneeNameMap,
}) => (
  <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Массовое редактирование ({selectedCount} лидов)</DialogTitle>
    <DialogContent sx={{ pt: 3 }}>
      <TextField
        select
        fullWidth
        label="Установить статус"
        value={statusId === '' ? '__none__' : statusId}
        onChange={(e) => onStatusIdChange(e.target.value === '__none__' ? '' : e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mt: 1, mb: 2, ...formFieldSx }}
        SelectProps={{
          sx: { color: 'rgba(255,255,255,0.95)' },
          renderValue: (v: unknown) => {
            if (!v || v === '__none__') return '— Не менять'
            const st = statuses.find((s) => s._id === v)
            if (!st) return String(v)
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: st.color || '#9ca3af', flexShrink: 0 }} />
                <span>{st.name}</span>
              </Box>
            )
          },
        }}
      >
        <MenuItem value="__none__">— Не менять</MenuItem>
        <MenuItem value=" ">— Сбросить статус</MenuItem>
        {statuses.map((s) => (
          <MenuItem key={s._id} value={s._id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color || '#9ca3af', flexShrink: 0 }} />
              <span>{s.name}</span>
            </Box>
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        fullWidth
        label="Установить источник (откуда лид)"
        value={leadTagId === '' ? '__none__' : leadTagId}
        onChange={(e) => onLeadTagIdChange(e.target.value === '__none__' ? '' : e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2, ...formFieldSx }}
        SelectProps={{
          sx: { color: 'rgba(255,255,255,0.95)' },
          renderValue: (v: unknown) => {
            if (!v || v === '__none__') return '— Не менять'
            if (v === ' ') return '— Сбросить'
            const tag = leadTagOptions.find((t) => t.id === v)
            if (!tag) return String(v)
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: tag.color, flexShrink: 0 }} />
                <span>{tag.name}</span>
              </Box>
            )
          },
        }}
      >
        <MenuItem value="__none__">— Не менять</MenuItem>
        <MenuItem value=" ">— Сбросить</MenuItem>
        {leadTagOptions.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color, flexShrink: 0 }} />
              <span>{t.name}</span>
            </Box>
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        fullWidth
        label="Установить ответственного (клоузера)"
        value={closerId === '' ? '__none__' : closerId}
        onChange={(e) => onCloserIdChange(e.target.value === '__none__' ? '' : e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2, ...formFieldSx }}
        SelectProps={{
          sx: { color: 'rgba(255,255,255,0.95)' },
          renderValue: (v: unknown) => {
            if (!v || v === '__none__') return '— Не менять'
            if (v === ' ') return '— Сбросить'
            const o = assigneeOptions.find((opt) => opt.id === v)
            return o ? o.label : String(v)
          },
        }}
      >
        <MenuItem value="__none__">— Не менять</MenuItem>
        <MenuItem value=" ">— Сбросить</MenuItem>
        {assigneeOptions.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
      <FormControl fullWidth sx={{ mb: 2, ...formFieldSx }}>
        <InputLabel id="bulk-edit-assignees-label" shrink>Исполнители</InputLabel>
        <Select
          labelId="bulk-edit-assignees-label"
          label="Исполнители"
          multiple
          value={assignedTo}
          onChange={(e) => {
            const v = e.target.value
            const next = Array.isArray(v) ? v : (v === undefined || v === null ? [] : [String(v)])
            if (next.includes('__clear__')) {
              onAssignedToChange([])
              return
            }
            if (next.includes('__none__')) {
              onAssignedToChange(['__none__'])
              return
            }
            const filtered = next.filter((id) => id !== '__none__' && id !== '__clear__')
            onAssignedToChange(filtered)
          }}
          renderValue={(selected) => {
            const arr = Array.isArray(selected) ? selected : []
            if (arr.length === 0) return '— Сбросить'
            if (arr.length === 1 && arr[0] === '__none__') return '— Не менять'
            return arr.map((id) => assigneeNameMap[id] || id).join(', ')
          }}
          variant="outlined"
          sx={{ color: 'rgba(255,255,255,0.95)' }}
        >
          <MenuItem value="__none__">— Не менять</MenuItem>
          <MenuItem value="__clear__">— Сбросить</MenuItem>
          {assigneeOptions.map((o) => (
            <MenuItem key={o.id} value={o.id}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
        Статус: «Не менять» — не трогать; «Сбросить» — убрать статус. Источник: тег откуда пришёл лид. Исполнители: «Не менять» — не трогать; «Сбросить» — снять назначение; выберите пользователей — назначить.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Отмена
      </Button>
      <Button
        variant="contained"
        onClick={onApply}
        disabled={saving}
        sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
      >
        {saving ? 'Сохранение…' : 'Применить'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default BulkEditDialog
