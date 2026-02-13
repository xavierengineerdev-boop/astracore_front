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
  IconButton,
  Tooltip,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  type DepartmentItem,
} from '@/api/departments'
import { getUsers, type UserItem } from '@/api/users'

const formFieldSx = {
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}

const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [list, setList] = useState<DepartmentItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [managerId, setManagerId] = useState('')
  const canAccess = user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee'
  const canManage = user?.role === 'super'
  const [deleteTarget, setDeleteTarget] = useState<DepartmentItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!canAccess) {
      setLoading(false)
      return
    }
    let cancelled = false
    const needUsers = user?.role === 'super' || user?.role === 'admin'
    Promise.all([getDepartments(), needUsers ? getUsers() : Promise.resolve([])])
      .then(([depts, userList]) => {
        if (!cancelled) {
          setList(depts)
          setUsers((userList as UserItem[]) || [])
        }
      })
      .catch(() => { if (!cancelled) toast.error('Не удалось загрузить данные') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [canAccess, user?.role])

  const openModal = () => {
    setName('')
    setManagerId('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await createDepartment({ name: name.trim(), managerId: managerId || undefined })
      toast.success('Отдел создан')
      setModalOpen(false)
      const data = await getDepartments()
      setList(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, d: DepartmentItem) => {
    e.stopPropagation()
    setDeleteTarget(d)
  }
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDepartment(deleteTarget._id)
      toast.success('Отдел удалён')
      setDeleteTarget(null)
      const data = await getDepartments()
      setList(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleting(false)
    }
  }

  const getManagerName = (managerId?: string) => {
    if (!managerId) return '—'
    if (user?.userId && String(managerId) === String(user.userId)) return 'Вы'
    const u = users.find((x) => String(x._id) === String(managerId))
    return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : managerId
  }

  if (!canAccess) {
    return (
      <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
          Отделы
        </Typography>
        <Typography color="rgba(255,255,255,0.6)">Нет доступа.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600 }}>
          Отделы
        </Typography>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openModal}
            sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
          >
            Создать отдел
          </Button>
        )}
      </Box>

      <Dialog
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2 }}>
          Создать отдел
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              select
              label="Управляющий"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={formFieldSx}
              SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
            >
              <MenuItem value="">— Не назначен</MenuItem>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
            <Button onClick={() => setModalOpen(false)} disabled={submitting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {submitting ? 'Создание…' : 'Создать'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Название</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Управляющий</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)', width: 100 }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ color: 'rgba(255,255,255,0.5)', py: 3, textAlign: 'center' }}>
                    Нет отделов
                  </TableCell>
                </TableRow>
              ) : (
                list.map((d) => (
                  <TableRow
                    key={d._id}
                    hover
                    onClick={() => navigate(`/departments/${d._id}`)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                  >
                    <TableCell sx={{ color: 'rgba(255,255,255,0.9)' }}>{d.name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{getManagerName(d.managerId)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Открыть">
                          <IconButton size="small" onClick={() => navigate(`/departments/${d._id}`)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canManage && (
                          <Tooltip title="Удалить">
                            <IconButton size="small" onClick={(e) => handleDeleteClick(e, d)} sx={{ color: 'rgba(248,113,113,0.9)' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
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
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить отдел?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {deleteTarget?.name} — действие нельзя отменить.
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
    </Box>
  )
}

export default DepartmentsPage
