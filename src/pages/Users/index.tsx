import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import BackButton from '@/components/BackButton'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getCreatableRoles } from '@/constants/roles'
import { getUsers, createUser, updateUser, deleteUser, type UserItem } from '@/api/users'
import { getDepartments, type DepartmentItem } from '@/api/departments'
import { CreateUserDialog, UsersTable, DeleteUserDialog, RemoveFromDeptDialog } from './components'

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
  const canRemoveFromDept = (u: UserItem): boolean =>
    user?.role === 'manager' &&
    u.role === 'employee' &&
    Boolean(u.departmentId) &&
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <BackButton fallbackTo="/" />
          <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600 }}>
            Пользователи
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={openModal}
          sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
        >
          Создать пользователя
        </Button>
      </Box>

      <CreateUserDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        creatableRoles={creatableRoles}
        departments={departments}
        firstName={firstName}
        onFirstNameChange={setFirstName}
        lastName={lastName}
        onLastNameChange={setLastName}
        email={email}
        onEmailChange={setEmail}
        phone={phone}
        onPhoneChange={setPhone}
        password={password}
        onPasswordChange={setPassword}
        role={role}
        onRoleChange={setRole}
        departmentId={departmentId}
        onDepartmentIdChange={setDepartmentId}
        isActive={isActive}
        onIsActiveChange={setIsActive}
      />

      <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
        Пользователи в системе
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : (
        <UsersTable
          list={list}
          departments={departments}
          canEditUser={canEditUser}
          canDeleteUser={canDeleteUser}
          canRemoveFromDept={canRemoveFromDept}
          onRowClick={(u) => navigate(`/users/${u._id}`)}
          onEdit={(u) => navigate(`/users/${u._id}`)}
          onRemoveFromDept={(u) => setRemoveFromDeptTarget(u)}
          onDelete={handleDeleteClick}
        />
      )}

      <DeleteUserDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
        userEmail={deleteTarget?.email ?? ''}
      />

      <RemoveFromDeptDialog
        open={Boolean(removeFromDeptTarget)}
        onClose={() => setRemoveFromDeptTarget(null)}
        onConfirm={handleRemoveFromDeptConfirm}
        removing={removingFromDept}
        userEmail={removeFromDeptTarget?.email ?? ''}
      />
    </Box>
  )
}

export default UsersPage
