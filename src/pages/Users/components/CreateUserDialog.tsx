import React from 'react'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { formFieldSx, dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'
import { ROLE_LABELS } from '@/constants/roles'
import type { DepartmentItem } from '@/api/departments'

const formFieldSxWithHelper = { ...formFieldSx, '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.45)' } }

export interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  creatableRoles: string[]
  departments: DepartmentItem[]
  firstName: string
  onFirstNameChange: (v: string) => void
  lastName: string
  onLastNameChange: (v: string) => void
  email: string
  onEmailChange: (v: string) => void
  phone: string
  onPhoneChange: (v: string) => void
  password: string
  onPasswordChange: (v: string) => void
  role: string
  onRoleChange: (v: string) => void
  departmentId: string
  onDepartmentIdChange: (v: string) => void
  isActive: boolean
  onIsActiveChange: (v: boolean) => void
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
  submitting,
  creatableRoles,
  departments,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  password,
  onPasswordChange,
  role,
  onRoleChange,
  departmentId,
  onDepartmentIdChange,
  isActive,
  onIsActiveChange,
}) => (
  <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Создать пользователя</DialogTitle>
    <Box component="form" onSubmit={onSubmit}>
      <DialogContent sx={{ pt: 2 }}>
        <TextField label="Имя" value={firstName} onChange={(e) => onFirstNameChange(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSx }} />
        <TextField label="Фамилия" value={lastName} onChange={(e) => onLastNameChange(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSx }} />
        <TextField label="Email" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} required fullWidth InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSx }} />
        <TextField label="Телефон" value={phone} onChange={(e) => onPhoneChange(e.target.value)} fullWidth placeholder="+380501234567" InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSx }} />
        <TextField label="Пароль" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} required fullWidth helperText="Минимум 6 символов" InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSxWithHelper }} />
        <TextField select label="Роль" value={role} onChange={(e) => onRoleChange(e.target.value)} required fullWidth InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSx }} SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}>
          {creatableRoles.map((r) => (
            <MenuItem key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS]}</MenuItem>
          ))}
        </TextField>
        <TextField select label="Отдел" value={departmentId} onChange={(e) => onDepartmentIdChange(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} sx={{ mb: 2, ...formFieldSx }} SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}>
          <MenuItem value="">— Без отдела</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Switch checked={isActive} onChange={(e) => onIsActiveChange(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }} />}
          label={<Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Активен</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ color: 'rgba(255,255,255,0.7)' }}>Отмена</Button>
        <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />} sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}>
          {submitting ? 'Создание…' : 'Создать'}
        </Button>
      </DialogActions>
    </Box>
  </Dialog>
)

export default CreateUserDialog
