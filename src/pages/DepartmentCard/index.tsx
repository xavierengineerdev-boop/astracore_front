import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import LabelIcon from '@mui/icons-material/Label'
import PublicIcon from '@mui/icons-material/Public'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { ROLE_LABELS } from '@/constants/roles'
import {
  getDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  type DepartmentDetail,
  type DepartmentItem,
} from '@/api/departments'
import { getUsers, updateUser, createUser, type UserItem } from '@/api/users'
import {
  getStatusesByDepartment,
  createStatus,
  updateStatus,
  deleteStatus,
  type StatusItem,
} from '@/api/statuses'
import { API_BASE } from '@/api/client'
import {
  getSitesByDepartment,
  createSite,
  deleteSite,
  type SiteItem,
} from '@/api/sites'

const formFieldSx = {
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}

const DepartmentCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [department, setDepartment] = useState<DepartmentDetail | null>(null)
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editManagerId, setEditManagerId] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [addEmployeeUserIds, setAddEmployeeUserIds] = useState<string[]>([])
  const [createEmployeeOpen, setCreateEmployeeOpen] = useState(false)
  const [createEmployeeEmail, setCreateEmployeeEmail] = useState('')
  const [createEmployeePassword, setCreateEmployeePassword] = useState('')
  const [createEmployeeFirstName, setCreateEmployeeFirstName] = useState('')
  const [createEmployeeLastName, setCreateEmployeeLastName] = useState('')
  const [createEmployeePhone, setCreateEmployeePhone] = useState('')
  const [createEmployeeSaving, setCreateEmployeeSaving] = useState(false)
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const isEmployeeOwnDept =
    currentUser?.role === 'employee' &&
    id &&
    (currentUser as { departmentId?: string }).departmentId === id
  const canAccess =
    currentUser?.role === 'super' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    isEmployeeOwnDept
  const isManagerOfThisDept = Boolean(
    id && department?.managerId && currentUser?.userId && String(department.managerId) === String(currentUser.userId),
  )
  const canManage = currentUser?.role === 'super' || isManagerOfThisDept
  const canAssignEmployees = currentUser?.role === 'super' || currentUser?.role === 'admin'
  const canManageStatuses = currentUser?.role === 'super' || isManagerOfThisDept
  const canManageSites = canManageStatuses

  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusFormOpen, setStatusFormOpen] = useState(false)
  const [statusEditId, setStatusEditId] = useState<string | null>(null)
  const [statusName, setStatusName] = useState('')
  const [statusDescription, setStatusDescription] = useState('')
  const [statusColor, setStatusColor] = useState('#9ca3af')
  const [statusDepartmentId, setStatusDepartmentId] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusDeleteId, setStatusDeleteId] = useState<string | null>(null)
  const [statusDeleting, setStatusDeleting] = useState(false)

  const [sites, setSites] = useState<SiteItem[]>([])
  const [siteLoading, setSiteLoading] = useState(false)
  const [siteFormOpen, setSiteFormOpen] = useState(false)
  const [siteUrl, setSiteUrl] = useState('')
  const [siteDescription, setSiteDescription] = useState('')
  const [siteSaving, setSiteSaving] = useState(false)
  const [siteDeleteId, setSiteDeleteId] = useState<string | null>(null)
  const [siteDeleting, setSiteDeleting] = useState(false)
  const [createdSiteToken, setCreatedSiteToken] = useState<string | null>(null)

  useEffect(() => {
    if (!canAccess || !id) {
      setLoading(false)
      return
    }
    let cancelled = false
    const fetches: Promise<unknown>[] = [
      getDepartment(id),
      getStatusesByDepartment(id),
      getSitesByDepartment(id),
    ]
    if (canAssignEmployees) fetches.splice(1, 0, getUsers())
    if (currentUser?.role === 'super') fetches.push(getDepartments())
    Promise.all(fetches)
      .then((results) => {
        if (!cancelled) {
          setDepartment(results[0] as DepartmentDetail)
          let idx = 1
          if (canAssignEmployees) {
            setUsers(results[idx] as UserItem[])
            idx++
          }
          setStatuses(results[idx] as StatusItem[])
          idx++
          setSites(results[idx] as SiteItem[])
          idx++
          if (results[idx]) setDepartments(results[idx] as DepartmentItem[])
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Отдел не найден')
          navigate('/departments')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [canAccess, canAssignEmployees, id, currentUser?.role])

  const openEdit = () => {
    if (!department) return
    setEditName(department.name)
    setEditManagerId(department.managerId ?? '')
    setEditOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateDepartment(id, {
        name: editName.trim(),
        managerId: editManagerId || undefined,
      })
      setDepartment((prev) => (prev ? { ...prev, ...updated } : null))
      setEditOpen(false)
      toast.success('Изменения сохранены')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteDepartment(id)
      toast.success('Отдел удалён')
      navigate('/departments')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  const refetchDepartment = async () => {
    if (!id) return
    try {
      const dept = await getDepartment(id)
      setDepartment(dept)
    } catch {
      // keep current state
    }
  }

  const availableToAdd = department
    ? users.filter((u) => !department.employees.some((e) => e._id === u._id))
    : []

  const handleAddEmployee = () => {
    setAddEmployeeUserIds([])
    setAddEmployeeOpen(true)
  }

  const handleCreateEmployeeOpen = () => {
    setCreateEmployeeEmail('')
    setCreateEmployeePassword('')
    setCreateEmployeeFirstName('')
    setCreateEmployeeLastName('')
    setCreateEmployeePhone('')
    setCreateEmployeeOpen(true)
  }

  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !createEmployeeEmail.trim() || !createEmployeePassword.trim()) return
    if (createEmployeePassword.length < 6) {
      toast.error('Пароль не менее 6 символов')
      return
    }
    setCreateEmployeeSaving(true)
    try {
      await createUser({
        email: createEmployeeEmail.trim(),
        password: createEmployeePassword,
        role: 'employee',
        departmentId: id,
        firstName: createEmployeeFirstName.trim() || undefined,
        lastName: createEmployeeLastName.trim() || undefined,
        phone: createEmployeePhone.trim() || undefined,
        isActive: true,
      })
      toast.success('Сотрудник создан')
      setCreateEmployeeOpen(false)
      await refetchDepartment()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setCreateEmployeeSaving(false)
    }
  }

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || addEmployeeUserIds.length === 0) return
    setAddingEmployee(true)
    try {
      await Promise.all(addEmployeeUserIds.map((userId) => updateUser(userId, { departmentId: id })))
      await refetchDepartment()
      const userList = await getUsers()
      setUsers(userList)
      setAddEmployeeOpen(false)
      const n = addEmployeeUserIds.length
      toast.success(n === 1 ? 'Сотрудник добавлен в отдел' : `Добавлено сотрудников: ${n}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setAddingEmployee(false)
    }
  }

  const selectAllAvailable = () => {
    setAddEmployeeUserIds(availableToAdd.map((u) => u._id))
  }

  const clearAddSelection = () => {
    setAddEmployeeUserIds([])
  }

  const refetchSites = async () => {
    if (!id) return
    setSiteLoading(true)
    try {
      const list = await getSitesByDepartment(id)
      setSites(list)
    } catch {
      setSites([])
    } finally {
      setSiteLoading(false)
    }
  }

  const refetchStatuses = async () => {
    if (!id) return
    setStatusLoading(true)
    try {
      const list = await getStatusesByDepartment(id)
      setStatuses(list)
    } catch {
      // ignore
    } finally {
      setStatusLoading(false)
    }
  }

  const openStatusCreate = () => {
    setStatusEditId(null)
    setStatusName('')
    setStatusDescription('')
    setStatusColor('#9ca3af')
    setStatusDepartmentId(id ?? '')
    setStatusFormOpen(true)
  }

  const openStatusEdit = (s: StatusItem) => {
    setStatusEditId(s._id)
    setStatusName(s.name)
    setStatusDescription(s.description ?? '')
    setStatusColor(s.color ?? '#9ca3af')
    setStatusDepartmentId(s.departmentId)
    setStatusFormOpen(true)
  }

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusName.trim()) return
    setStatusSaving(true)
    try {
      if (statusEditId) {
        await updateStatus(statusEditId, {
          name: statusName.trim(),
          description: statusDescription.trim() || undefined,
          color: statusColor.trim(),
          departmentId: statusDepartmentId || undefined,
        })
        toast.success('Статус обновлён')
      } else {
        await createStatus({
          name: statusName.trim(),
          description: statusDescription.trim() || undefined,
          color: statusColor.trim(),
          departmentId: statusDepartmentId || id!,
        })
        toast.success('Статус создан')
      }
      await refetchStatuses()
      setStatusFormOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setStatusSaving(false)
    }
  }

  const handleStatusDelete = async () => {
    if (!statusDeleteId) return
    setStatusDeleting(true)
    try {
      await deleteStatus(statusDeleteId)
      toast.success('Статус удалён')
      await refetchStatuses()
      setStatusDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setStatusDeleting(false)
    }
  }

  const openSiteCreate = () => {
    setSiteUrl('')
    setSiteDescription('')
    setCreatedSiteToken(null)
    setSiteFormOpen(true)
  }

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteUrl.trim() || !id) return
    setSiteSaving(true)
    setCreatedSiteToken(null)
    try {
      const created = await createSite({
        url: siteUrl.trim(),
        description: siteDescription.trim() || undefined,
        departmentId: id,
      })
      setCreatedSiteToken(created.token)
      await refetchSites()
      await refetchDepartment()
      toast.success('Сайт добавлен. Скопируйте токен и передайте его на сайт.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSiteSaving(false)
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => toast.success('Токен скопирован'))
  }

  const copyWidgetScript = (siteId: string) => {
    const scriptUrl = `${API_BASE}/sites/${siteId}/widget.js`
    const snippet = `<div id="astracore-lead-form"></div>\n<script src="${scriptUrl}"><\/script>`
    navigator.clipboard.writeText(snippet).then(() => toast.success('Скрипт скопирован — вставьте на сайт'))
  }

  const handleSiteDelete = async () => {
    if (!siteDeleteId) return
    setSiteDeleting(true)
    try {
      await deleteSite(siteDeleteId)
      toast.success('Сайт удалён')
      await refetchSites()
      await refetchDepartment()
      setSiteDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSiteDeleting(false)
    }
  }

  const handleRemoveFromDepartment = async (userId: string) => {
    if (!id) return
    setRemovingUserId(userId)
    try {
      await updateUser(userId, { departmentId: undefined })
      await refetchDepartment()
      const userList = await getUsers()
      setUsers(userList)
      toast.success('Сотрудник убран из отдела')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setRemovingUserId(null)
    }
  }

  if (!canAccess) {
    return (
      <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
          Карточка отдела
        </Typography>
        <Typography color="rgba(255,255,255,0.6)">Нет доступа.</Typography>
      </Box>
    )
  }

  if (loading || !department) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(isEmployeeOwnDept ? '/' : '/departments')}
          sx={{ color: 'rgba(196,181,253,0.9)' }}
        >
          {isEmployeeOwnDept ? 'На главную' : 'К списку отделов'}
        </Button>
        {canManage && (
          <>
            <Tooltip title="Редактировать">
              <IconButton onClick={openEdit} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton onClick={() => setDeleteConfirmOpen(true)} sx={{ color: 'rgba(248,113,113,0.9)' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
        Карточка отдела
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <Paper
            sx={{
              p: 3,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                  Название
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                  {department.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                  Управляющий
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }} noWrap>
                  {department.manager
                    ? [department.manager.firstName, department.manager.lastName].filter(Boolean).join(' ') || department.manager.email
                    : '— Не назначен'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                  Сотрудников
                </Typography>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(167,139,250,0.2)',
                    color: 'rgba(196,181,253,0.95)',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  {department.employeesCount ?? department.employees?.length ?? 0}
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                  Статусов
                </Typography>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(167,139,250,0.2)',
                    color: 'rgba(196,181,253,0.95)',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  {department.statusesCount ?? statuses.length}
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                  Сайтов
                </Typography>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(167,139,250,0.2)',
                    color: 'rgba(196,181,253,0.95)',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  {department.sitesCount ?? sites.length ?? 0}
                </Box>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Сотрудники отдела
            </Typography>
            {(canAssignEmployees || canManage) && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {canManage && (
                  <Button
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={handleCreateEmployeeOpen}
                    sx={{ color: 'rgba(167,139,250,0.9)' }}
                  >
                    Создать сотрудника
                  </Button>
                )}
                {canAssignEmployees && (
                  <Button
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={handleAddEmployee}
                    sx={{ color: 'rgba(167,139,250,0.9)' }}
                  >
                    Добавить в отдел
                  </Button>
                )}
              </Box>
            )}
          </Box>
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              maxHeight: 280,
              overflow: 'auto',
            }}
          >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Имя</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Email</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Роль</TableCell>
              {canAssignEmployees && (
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', width: 56, bgcolor: 'rgba(255,255,255,0.04)' }} align="right" />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {department.employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAssignEmployees ? 4 : 3} sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                  {canAssignEmployees
                    ? 'Нет сотрудников в отделе. Нажмите «Добавить сотрудника».'
                    : 'Нет сотрудников в отделе.'}
                </TableCell>
              </TableRow>
            ) : (
              department.employees.map((u) => (
                <TableRow
                  key={u._id}
                  hover
                  sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
                  <TableCell
                    sx={{ color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${u._id}`)}
                  >
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    {department.managerId === u._id && (
                      <Typography component="span" variant="caption" sx={{ ml: 1, color: 'rgba(255,255,255,0.5)' }}>
                        (руководитель)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }} onClick={() => navigate(`/users/${u._id}`)}>
                    {u.email}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }} onClick={() => navigate(`/users/${u._id}`)}>
                    {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                  </TableCell>
                  {canAssignEmployees && (
                    <TableCell align="right" sx={{ py: 0 }} onClick={(e) => e.stopPropagation()}>
                      {department.managerId !== u._id ? (
                        <Tooltip title="Убрать из отдела">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFromDepartment(u._id)}
                            disabled={removingUserId === u._id}
                            sx={{ color: 'rgba(248,113,113,0.8)' }}
                          >
                            {removingUserId === u._id ? (
                              <CircularProgress size={20} sx={{ color: 'rgba(248,113,113,0.8)' }} />
                            ) : (
                              <PersonRemoveIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Статусы отдела
            </Typography>
            {canManageStatuses ? (
              <Button
                size="small"
                startIcon={<LabelIcon />}
                onClick={openStatusCreate}
                sx={{ color: 'rgba(167,139,250,0.9)' }}
              >
                Добавить статус
              </Button>
            ) : (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                Добавлять статусы может только руководитель этого отдела или суперпользователь
              </Typography>
            )}
          </Box>
          <TableContainer
            id="statuses-section"
            component={Paper}
            sx={{
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              maxHeight: 280,
              overflow: 'auto',
            }}
          >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', width: 40, bgcolor: 'rgba(255,255,255,0.04)' }}>Цвет</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Название</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Описание</TableCell>
              {canManageStatuses && (
                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', width: 56, bgcolor: 'rgba(255,255,255,0.04)' }} align="right" />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {statusLoading ? (
              <TableRow>
                <TableCell colSpan={canManageStatuses ? 4 : 3} sx={{ py: 2, textAlign: 'center' }}>
                  <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
                </TableCell>
              </TableRow>
            ) : statuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageStatuses ? 4 : 3} sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                  {canManageStatuses
                    ? 'Нет статусов. Нажмите «Добавить статус».'
                    : 'Нет статусов.'}
                </TableCell>
              </TableRow>
            ) : (
              statuses.map((s) => (
                <TableRow
                  key={s._id}
                  hover
                  sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
                  <TableCell sx={{ py: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: s.color || '#9ca3af',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.95)' }}>
                    {s.name}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {s.description || '—'}
                  </TableCell>
                  {canManageStatuses && (
                    <TableCell align="right" sx={{ py: 0 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 0 }}>
                        <Tooltip title="Редактировать">
                          <IconButton size="small" onClick={() => openStatusEdit(s)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" onClick={() => setStatusDeleteId(s._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap', mt: 2 }}>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Сайты отдела
            </Typography>
            {canManageSites && (
              <Button
                size="small"
                startIcon={<PublicIcon />}
                onClick={openSiteCreate}
                sx={{ color: 'rgba(167,139,250,0.9)' }}
              >
                Добавить сайт
              </Button>
            )}
          </Box>
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              maxHeight: 260,
              overflow: 'auto',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>URL</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Описание</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 140, bgcolor: 'rgba(255,255,255,0.04)' }}>Токен</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 120, bgcolor: 'rgba(255,255,255,0.04)' }}>Скрипт</TableCell>
                  {canManageSites && (
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)', width: 56, bgcolor: 'rgba(255,255,255,0.04)' }} align="right" />
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {siteLoading ? (
                  <TableRow>
                    <TableCell colSpan={canManageSites ? 5 : 4} sx={{ py: 2, textAlign: 'center' }}>
                      <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
                    </TableCell>
                  </TableRow>
                ) : sites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageSites ? 5 : 4} sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                      {canManageSites ? 'Нет сайтов. Нажмите «Добавить сайт» и передайте токен на сайт.' : 'Нет сайтов.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sites.map((site) => (
                    <TableRow key={site._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 180 }}>
                        <Typography noWrap sx={{ maxWidth: 180 }}>{site.url}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{site.description || '—'}</TableCell>
                      <TableCell sx={{ py: 0 }}>
                        {canManageSites ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                            onClick={() => copyToken(site.token)}
                            sx={{
                              borderColor: 'rgba(167,139,250,0.4)',
                              color: 'rgba(196,181,253,0.95)',
                              textTransform: 'none',
                              '&:hover': { borderColor: 'rgba(167,139,250,0.8)', bgcolor: 'rgba(167,139,250,0.08)' },
                            }}
                          >
                            Копировать токен
                          </Button>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 0 }}>
                        <Tooltip title="Скопировать код для вставки на сайт (скрипт уже с токеном)">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                            onClick={() => copyWidgetScript(site._id)}
                            sx={{
                              borderColor: 'rgba(46,196,182,0.4)',
                              color: 'rgba(94,234,212,0.95)',
                              textTransform: 'none',
                              '&:hover': { borderColor: 'rgba(46,196,182,0.8)', bgcolor: 'rgba(46,196,182,0.08)' },
                            }}
                          >
                            Скрипт
                          </Button>
                        </Tooltip>
                      </TableCell>
                      {canManageSites && (
                        <TableCell align="right" sx={{ py: 0 }}>
                          <Tooltip title="Удалить">
                            <IconButton size="small" onClick={() => setSiteDeleteId(site._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <Dialog
        open={statusFormOpen}
        onClose={() => !statusSaving && setStatusFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>
          {statusEditId ? 'Редактировать статус' : 'Новый статус'}
        </DialogTitle>
        <Box component="form" onSubmit={handleStatusSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            {currentUser?.role === 'super' && (
              <TextField
                select
                label="Отдел"
                value={statusDepartmentId}
                onChange={(e) => setStatusDepartmentId(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2, ...formFieldSx }}
                SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
              >
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Название"
              value={statusName}
              onChange={(e) => setStatusName(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Описание"
              value={statusDescription}
              onChange={(e) => setStatusDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Цвет:
              </Typography>
              <input
                type="color"
                value={statusColor}
                onChange={(e) => setStatusColor(e.target.value)}
                style={{
                  width: 40,
                  height: 32,
                  padding: 0,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
              />
              <TextField
                value={statusColor}
                onChange={(e) => setStatusColor(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ width: 100, ...formFieldSx }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setStatusFormOpen(false)} disabled={statusSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={statusSaving || !statusName.trim()}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {statusSaving ? 'Сохранение…' : statusEditId ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={!!statusDeleteId}
        onClose={() => !statusDeleting && setStatusDeleteId(null)}
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить статус?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Статус будет удалён. Действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDeleteId(null)} disabled={statusDeleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusDelete}
            disabled={statusDeleting}
            sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}
          >
            {statusDeleting ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={siteFormOpen}
        onClose={() => !siteSaving && (setSiteFormOpen(false), setCreatedSiteToken(null))}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>
          {createdSiteToken ? 'Токен создан' : 'Добавить сайт'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSiteSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            {createdSiteToken ? (
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1.5 }}>
                  Передайте токен на сайт — лиды с ним будут привязаны к отделу.
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.12)',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="input"
                    readOnly
                    value={createdSiteToken}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      py: 1.25,
                      px: 2,
                      border: 'none',
                      background: 'transparent',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.9)',
                      outline: 'none',
                    }}
                  />
                  <Button
                    onClick={() => copyToken(createdSiteToken)}
                    startIcon={<ContentCopyIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      borderRadius: 0,
                      borderLeft: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(167,139,250,0.95)',
                      textTransform: 'none',
                      px: 2,
                      '&:hover': { bgcolor: 'rgba(167,139,250,0.12)' },
                    }}
                  >
                    Копировать
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <TextField
                  label="URL сайта"
                  placeholder="https://..."
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2, ...formFieldSx }}
                />
                <TextField
                  label="Описание"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2, ...formFieldSx }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => { setSiteFormOpen(false); setCreatedSiteToken(null) }}
              disabled={siteSaving}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {createdSiteToken ? 'Закрыть' : 'Отмена'}
            </Button>
            {!createdSiteToken && (
              <Button
                type="submit"
                variant="contained"
                disabled={siteSaving || !siteUrl.trim()}
                sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
              >
                {siteSaving ? 'Создание…' : 'Создать и получить токен'}
              </Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={!!siteDeleteId}
        onClose={() => !siteDeleting && setSiteDeleteId(null)}
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить сайт?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Сайт будет удалён из списка. Токен перестанет действовать.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSiteDeleteId(null)} disabled={siteDeleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSiteDelete}
            disabled={siteDeleting}
            sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}
          >
            {siteDeleting ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Редактировать отдел</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              label="Название"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            {currentUser?.role === 'super' && (
              <TextField
                select
                label="Управляющий"
                value={editManagerId}
                onChange={(e) => setEditManagerId(e.target.value)}
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
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={addEmployeeOpen}
        onClose={() => !addingEmployee && setAddEmployeeOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Добавить сотрудников в отдел</DialogTitle>
        <Box component="form" onSubmit={handleAddEmployeeSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            {availableToAdd.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Все пользователи уже в этом отделе.
              </Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button size="small" onClick={selectAllAvailable} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                    Выбрать всех
                  </Button>
                  <Button size="small" onClick={clearAddSelection} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Снять выбор
                  </Button>
                </Box>
                <TextField
                  select
                  fullWidth
                  label="Пользователи"
                  value={addEmployeeUserIds}
                  onChange={(e) => setAddEmployeeUserIds(typeof e.target.value === 'string' ? [] : e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => {
                      const ids = selected as string[]
                      if (ids.length === 0) return 'Выберите одного или нескольких'
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {ids.map((userId) => {
                            const u = users.find((x) => x._id === userId)
                            const label = u ? u.email : userId
                            return (
                              <Box
                                key={userId}
                                component="span"
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  bgcolor: 'rgba(167,139,250,0.2)',
                                  border: '1px solid rgba(167,139,250,0.4)',
                                  fontSize: '0.8125rem',
                                  color: 'rgba(255,255,255,0.95)',
                                }}
                              >
                                {label}
                              </Box>
                            )
                          })}
                        </Box>
                      )
                    },
                    sx: { color: 'rgba(255,255,255,0.95)' },
                    MenuProps: {
                      PaperProps: {
                        sx: { maxHeight: 320, bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)' },
                      },
                    },
                  }}
                  sx={formFieldSx}
                >
                  {availableToAdd.map((u) => (
                    <MenuItem
                      key={u._id}
                      value={u._id}
                      disableRipple
                      sx={{
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        '&.Mui-focusVisible': { bgcolor: 'transparent' },
                      }}
                    >
                      <Checkbox
                        checked={addEmployeeUserIds.includes(u._id)}
                        disableRipple
                        size="small"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          mr: 1.5,
                          py: 0,
                          '&:hover': { bgcolor: 'transparent' },
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}
                      />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                        {[u.firstName?.trim(), u.lastName?.trim()].filter(Boolean).join(' ') || u.email}
                      </Typography>
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAddEmployeeOpen(false)} disabled={addingEmployee} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={addingEmployee || addEmployeeUserIds.length === 0}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {addingEmployee ? 'Добавление…' : addEmployeeUserIds.length > 0 ? `Добавить (${addEmployeeUserIds.length})` : 'Добавить'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={createEmployeeOpen}
        onClose={() => !createEmployeeSaving && setCreateEmployeeOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Создать сотрудника</DialogTitle>
        <Box component="form" onSubmit={handleCreateEmployeeSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              required
              fullWidth
              type="email"
              label="Email"
              value={createEmployeeEmail}
              onChange={(e) => setCreateEmployeeEmail(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              required
              fullWidth
              type="password"
              label="Пароль (не менее 6 символов)"
              value={createEmployeePassword}
              onChange={(e) => setCreateEmployeePassword(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              fullWidth
              label="Имя"
              value={createEmployeeFirstName}
              onChange={(e) => setCreateEmployeeFirstName(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              fullWidth
              label="Фамилия"
              value={createEmployeeLastName}
              onChange={(e) => setCreateEmployeeLastName(e.target.value)}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              fullWidth
              label="Телефон"
              value={createEmployeePhone}
              onChange={(e) => setCreateEmployeePhone(e.target.value)}
              sx={formFieldSx}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateEmployeeOpen(false)} disabled={createEmployeeSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createEmployeeSaving || !createEmployeeEmail.trim() || createEmployeePassword.length < 6}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {createEmployeeSaving ? 'Создание…' : 'Создать'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить отдел?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {department.name} — действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
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

export default DepartmentCardPage
