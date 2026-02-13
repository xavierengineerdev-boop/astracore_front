import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getCreatableRoles, ROLE_LABELS } from '@/constants/roles'
import { getUsers, createUser, updateUser, deleteUser, type UserItem } from '@/api/users'
import { getDepartments, type DepartmentItem } from '@/api/departments'

function formatDate(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

const formFieldSx = {
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}
const formFieldSxWithHelper = { ...formFieldSx, '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.45)' } }

const UsersPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [list, setList] = useState<UserItem[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [departmentId, setDepartmentId] = useState('')
  const creatableRoles = getCreatableRoles(user?.role ?? '')
  const [role, setRole] = useState('employee')
  const canAccess = creatableRoles.length > 0
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [removeFromDeptTarget, setRemoveFromDeptTarget] = useState<UserItem | null>(null)
  const [removingFromDept, setRemovingFromDept] = useState(false)

  const canEditUser = (u: UserItem) =>
    user?.role === 'super' ||
    (user?.role === 'admin' && ['manager', 'employee'].includes(u.role)) ||
    (user?.role === 'manager' && u.role === 'employee' && String(u.departmentId) === String((user as { departmentId?: string }).departmentId))
  const canDeleteUser = (u: UserItem) =>
    String(u._id) !== String(user?.userId) &&
    (user?.role === 'super' ||
      (user?.role === 'admin' && ['manager', 'employee'].includes(u.role)) ||
      (user?.role === 'manager' && u.role === 'employee' && String(u.departmentId) === String((user as { departmentId?: string }).departmentId)))
  const canRemoveFromDept = (u: UserItem) =>
    user?.role === 'manager' &&
    u.role === 'employee' &&
    u.departmentId &&
    String(u.departmentId) === String((user as { departmentId?: string }).departmentId)

  useEffect(() => {
    if (!canAccess) {
      setLoading(false)
      return
    }
    let cancelled = false
    Promise.all([getUsers(), getDepartments()])
      .then(([userList, deptList]) => {
        if (!cancelled) {
          setList(userList)
          setDepartments(deptList)
        }
      })
      .catch(() => { if (!cancelled) toast.error('Не удалось загрузить список') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [canAccess])

  const openModal = () => {
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setIsActive(true)
    setDepartmentId('')
    setRole('employee')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password || !role) return
    setSubmitting(true)
    try {
      await createUser({
        email: email.trim(),
        password,
        role,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        isActive,
        departmentId: departmentId || undefined,
      })
      toast.success('Пользователь создан')
      setModalOpen(false)
      const data = await getUsers()
      setList(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, u: UserItem) => {
    e.stopPropagation()
    setDeleteTarget(u)
  }
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteTarget._id)
      toast.success('Пользователь удалён')
      setDeleteTarget(null)
      const data = await getUsers()
      setList(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveFromDeptConfirm = async () => {
    if (!removeFromDeptTarget) return
    setRemovingFromDept(true)
    try {
      await updateUser(removeFromDeptTarget._id, { departmentId: '' })
      toast.success('Сотрудник убран из отдела')
      setRemoveFromDeptTarget(null)
      const data = await getUsers()
      setList(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setRemovingFromDept(false)
    }
  }

  if (!canAccess) {
    return (
      <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
          Пользователи
        </Typography>
        <Typography color="rgba(255,255,255,0.6)">
          Нет доступа. Создавать пользователей могут только суперпользователь и администратор.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600 }}>
          Пользователи
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={openModal}
          sx={{
            bgcolor: 'rgba(124, 58, 237, 0.9)',
            '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' },
          }}
        >
          Создать пользователя
        </Button>
      </Box>

      <Dialog
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 22, 36, 0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2 }}>
          Создать пользователя
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              label="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              placeholder="+380501234567"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              helperText="Минимум 6 символов"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSxWithHelper }}
            />
            <TextField
              select
              label="Роль"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
              SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
            >
              {creatableRoles.map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Отдел"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
              SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
            >
              <MenuItem value="">— Без отдела</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                />
              }
              label={<Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Активен</Typography>}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
            <Button onClick={() => setModalOpen(false)} disabled={submitting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {submitting ? 'Создание…' : 'Создать'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
        Пользователи в системе
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Имя
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Email
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Роль
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Статус
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Отдел
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Дата создания
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Последний вход
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)', width: 100 }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)', py: 3, textAlign: 'center' }}>
                    Нет пользователей
                  </TableCell>
                </TableRow>
              ) : (
                list.map((u) => (
                  <TableRow
                    key={u._id}
                    hover
                    onClick={() => navigate(`/users/${u._id}`)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                  >
                    <TableCell sx={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      {u.email}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                    </TableCell>
                    <TableCell sx={{ color: u.isActive !== false ? 'rgba(167,139,250,0.9)' : 'rgba(248,113,113,0.9)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      {u.isActive !== false ? 'Активен' : 'Отключён'}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      {u.departmentId ? (departments.find((d) => String(d._id) === String(u.departmentId))?.name ?? '—') : '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {canEditUser(u) ? (
                          <Tooltip title="Редактировать">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/users/${u._id}`)}
                              sx={{ color: 'rgba(167,139,250,0.9)' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        {canRemoveFromDept(u) ? (
                          <Tooltip title="Удалить из отдела">
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setRemoveFromDeptTarget(u) }}
                              sx={{ color: 'rgba(251,191,36,0.9)' }}
                            >
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        {canDeleteUser(u) ? (
                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              onClick={(e) => handleDeleteClick(e, u)}
                              sx={{ color: 'rgba(248,113,113,0.9)' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 22, 36, 0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>
          Удалить пользователя?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {deleteTarget?.email} — действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting}
            sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}
          >
            {deleting ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(removeFromDeptTarget)}
        onClose={() => !removingFromDept && setRemoveFromDeptTarget(null)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(18, 22, 36, 0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>
          Удалить сотрудника из отдела?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {removeFromDeptTarget?.email} будет убран из вашего отдела. Учётная запись останется.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveFromDeptTarget(null)} disabled={removingFromDept} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleRemoveFromDeptConfirm}
            disabled={removingFromDept}
            sx={{ bgcolor: 'rgba(251,191,36,0.8)', color: '#000', '&:hover': { bgcolor: 'rgba(251,191,36,1)' } }}
          >
            {removingFromDept ? '…' : 'Удалить из отдела'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsersPage
