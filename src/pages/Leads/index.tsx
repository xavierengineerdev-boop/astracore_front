import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import UploadIcon from '@mui/icons-material/Upload'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getDepartments, getDepartment, type DepartmentItem, type DepartmentDetail } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
import {
  getLeadsByDepartment,
  createLead,
  updateLead,
  deleteLead,
  bulkCreateLeads,
  bulkUpdateLeads,
  bulkDeleteLeads,
  type LeadItem,
} from '@/api/leads'
import * as XLSX from 'xlsx'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'

const formFieldSx = {
  '& .MuiOutlinedInput-root': { minHeight: 48 },
  '& .MuiOutlinedInput-input': {
    paddingTop: '16px',
    paddingBottom: '16px',
    boxSizing: 'border-box',
  },
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50]

const LeadsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  // Сотрудник видит только свои лиды; руководитель, админ, супер — могут выбирать «Все» / «Мои»
  const scopeFromUrl = searchParams.get('scope') === 'mine' ? 'mine' : 'all'
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadTotal, setLeadTotal] = useState(0)
  const [leadPage, setLeadPage] = useState(0)
  const [leadRowsPerPage, setLeadRowsPerPage] = useState(25)
  const [leadFilterName, setLeadFilterName] = useState('')
  const [leadFilterPhone, setLeadFilterPhone] = useState('')
  const [leadFilterEmail, setLeadFilterEmail] = useState('')
  const [leadFilterStatusId, setLeadFilterStatusId] = useState('')
  const [leadFilterAssignedTo, setLeadFilterAssignedTo] = useState('')
  const [leadFilterDateFrom, setLeadFilterDateFrom] = useState('')
  const [leadFilterDateTo, setLeadFilterDateTo] = useState('')
  const [leadScope, setLeadScope] = useState<'all' | 'mine'>(scopeFromUrl)

  useEffect(() => {
    setLeadScope(user?.role === 'employee' ? 'mine' : scopeFromUrl)
  }, [scopeFromUrl, user?.role])

  const [leadSortBy, setLeadSortBy] = useState('createdAt')
  const [leadSortOrder, setLeadSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditStatusId, setBulkEditStatusId] = useState('')
  const [bulkEditChangeAssignees, setBulkEditChangeAssignees] = useState(false)
  const [bulkEditAssignedTo, setBulkEditAssignedTo] = useState<string[]>([])
  const [bulkEditSaving, setBulkEditSaving] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteSaving, setBulkDeleteSaving] = useState(false)
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [leadEditId, setLeadEditId] = useState<string | null>(null)
  const [leadName, setLeadName] = useState('')
  const [leadLastName, setLeadLastName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadPhone2, setLeadPhone2] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadEmail2, setLeadEmail2] = useState('')
  const [leadStatusId, setLeadStatusId] = useState('')
  const [leadAssignedTo, setLeadAssignedTo] = useState<string[]>([])
  const [leadSaving, setLeadSaving] = useState(false)
  const [departmentDetail, setDepartmentDetail] = useState<DepartmentDetail | null>(null)
  const [leadDeleteId, setLeadDeleteId] = useState<string | null>(null)
  const [leadDeleting, setLeadDeleting] = useState(false)
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkParsedItems, setBulkParsedItems] = useState<{ name: string; phone: string; email?: string }[] | null>(null)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ added: number; duplicates: number } | null>(null)
  const bulkFileInputRef = React.useRef<HTMLInputElement>(null)

  const parsePastedTable = (text: string): { name: string; phone: string; email?: string }[] => {
    const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    const items: { name: string; phone: string; email?: string }[] = []
    const headerLike = /^(имя|name|телефон|phone|почта|email|№)$/i
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(/[,;]/).map((s) => s.trim())
      const name = (parts[0] ?? '').trim()
      const phone = (parts[1] ?? '').trim().replace(/\s/g, '')
      const email = (parts[2] ?? '').trim().toLowerCase()
      if (i === 0 && (headerLike.test(name) || headerLike.test(phone) || headerLike.test(email))) continue
      if (name && phone) items.push({ name, phone, email: email || undefined })
    }
    return items
  }

  const canCreateLead =
    user?.role === 'super' ||
    (user?.role === 'manager' && selectedDepartmentId) ||
    (user?.role === 'employee' && (user as { departmentId?: string }).departmentId === selectedDepartmentId)
  const canBulkEditLeads = user?.role === 'super' || user?.role === 'manager'
  const canBulkDeleteLeads = user?.role === 'super' || user?.role === 'manager'
  const canBulkCreateLeads = user?.role === 'super' || user?.role === 'manager'
  const isEmployee = user?.role === 'employee'

  const assigneeOptions = useMemo(() => {
    if (!departmentDetail) return []
    const list: { id: string; label: string }[] = []
    const seen = new Set<string>()
    const add = (u: { _id: string; firstName?: string; lastName?: string; email: string }) => {
      if (seen.has(u._id)) return
      seen.add(u._id)
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
      list.push({ id: u._id, label: name || u.email })
    }
    if (departmentDetail.manager) add(departmentDetail.manager)
    ;(departmentDetail.employees || []).forEach(add)
    return list
  }, [departmentDetail])

  const assigneeNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    assigneeOptions.forEach((o) => { m[o.id] = o.label })
    return m
  }, [assigneeOptions])

  const bulkEditAssignedToSafe = useMemo(() => {
    const arr = Array.isArray(bulkEditAssignedTo) ? bulkEditAssignedTo : []
    return arr
  }, [bulkEditAssignedTo])

  useEffect(() => {
    let cancelled = false
    if (user?.role === 'employee' && (user as { departmentId?: string }).departmentId) {
      const deptId = (user as { departmentId?: string }).departmentId!
      getDepartment(deptId)
        .then((d) => {
          if (!cancelled) {
            setDepartments([{ _id: d._id, name: d.name, managerId: d.managerId, createdAt: d.createdAt, updatedAt: d.updatedAt }])
            setSelectedDepartmentId(d._id)
          }
        })
        .catch(() => { if (!cancelled) setDepartments([]) })
        .finally(() => { if (!cancelled) setLoadingDepts(false) })
    } else if (user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager') {
      getDepartments()
        .then((list) => {
          if (!cancelled) {
            setDepartments(list)
            if (list.length > 0 && !selectedDepartmentId) setSelectedDepartmentId(list[0]._id)
          }
        })
        .catch(() => { if (!cancelled) setDepartments([]) })
        .finally(() => { if (!cancelled) setLoadingDepts(false) })
    } else {
      setLoadingDepts(false)
    }
    return () => { cancelled = true }
  }, [user?.role, (user as { departmentId?: string })?.departmentId])

  useEffect(() => {
    const deptIdFromUrl = searchParams.get('departmentId')
    if (deptIdFromUrl && departments.some((d) => d._id === deptIdFromUrl)) {
      setSelectedDepartmentId(deptIdFromUrl)
    }
  }, [departments, searchParams])

  const prevDeptRef = React.useRef<string>('')
  useEffect(() => {
    if (!selectedDepartmentId) {
      setStatuses([])
      setLeads([])
      setLeadTotal(0)
      setDepartmentDetail(null)
      prevDeptRef.current = ''
      return
    }
    const deptChanged = prevDeptRef.current !== selectedDepartmentId
    if (deptChanged) {
      prevDeptRef.current = selectedDepartmentId
      setLeadPage(0)
    }
    const pageToUse = deptChanged ? 0 : leadPage
    let cancelled = false
    setLeadLoading(true)
    const filterParams = {
      skip: pageToUse * leadRowsPerPage,
      limit: leadRowsPerPage,
      ...(leadFilterName.trim() && { name: leadFilterName.trim() }),
      ...(leadFilterPhone.trim() && { phone: leadFilterPhone.trim() }),
      ...(leadFilterEmail.trim() && { email: leadFilterEmail.trim() }),
      ...(leadFilterStatusId && { statusId: leadFilterStatusId }),
      ...(leadFilterAssignedTo && { assignedTo: leadFilterAssignedTo }),
      ...(leadScope === 'mine' && user?.userId && { assignedTo: user.userId }),
      ...(leadFilterDateFrom.trim() && { dateFrom: leadFilterDateFrom.trim() }),
      ...(leadFilterDateTo.trim() && { dateTo: leadFilterDateTo.trim() }),
      sortBy: leadSortBy,
      sortOrder: leadSortOrder,
    }
    Promise.all([
      getStatusesByDepartment(selectedDepartmentId),
      getLeadsByDepartment(selectedDepartmentId, filterParams),
      getDepartment(selectedDepartmentId),
    ])
      .then(([statusList, leadData, dept]) => {
        if (!cancelled) {
          setStatuses(statusList)
          setLeads(leadData.items)
          setLeadTotal(leadData.total)
          setDepartmentDetail(dept)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatuses([])
          setLeads([])
          setLeadTotal(0)
          setDepartmentDetail(null)
        }
      })
      .finally(() => { if (!cancelled) setLeadLoading(false) })
    return () => { cancelled = true }
  }, [
    selectedDepartmentId,
    leadPage,
    leadRowsPerPage,
    leadFilterName,
    leadFilterPhone,
    leadFilterEmail,
    leadFilterStatusId,
    leadFilterAssignedTo,
    leadScope,
    user?.userId,
    leadFilterDateFrom,
    leadFilterDateTo,
    leadSortBy,
    leadSortOrder,
  ])

  const refetchLeads = async () => {
    if (!selectedDepartmentId) return
    setLeadLoading(true)
    try {
      const data = await getLeadsByDepartment(selectedDepartmentId, {
        skip: leadPage * leadRowsPerPage,
        limit: leadRowsPerPage,
        ...(leadFilterName.trim() && { name: leadFilterName.trim() }),
        ...(leadFilterPhone.trim() && { phone: leadFilterPhone.trim() }),
        ...(leadFilterEmail.trim() && { email: leadFilterEmail.trim() }),
        ...(leadFilterStatusId && { statusId: leadFilterStatusId }),
        ...(leadFilterAssignedTo && { assignedTo: leadFilterAssignedTo }),
        ...(leadScope === 'mine' && user?.userId && { assignedTo: user.userId }),
        ...(leadFilterDateFrom.trim() && { dateFrom: leadFilterDateFrom.trim() }),
        ...(leadFilterDateTo.trim() && { dateTo: leadFilterDateTo.trim() }),
        sortBy: leadSortBy,
        sortOrder: leadSortOrder,
      })
      setLeads(data.items)
      setLeadTotal(data.total)
    } catch {
      setLeads([])
      setLeadTotal(0)
    } finally {
      setLeadLoading(false)
    }
  }

  const resetLeadFilters = () => {
    setLeadFilterName('')
    setLeadFilterPhone('')
    setLeadFilterEmail('')
    setLeadFilterStatusId('')
    setLeadFilterAssignedTo('')
    setLeadFilterDateFrom('')
    setLeadFilterDateTo('')
    setLeadSortBy('createdAt')
    setLeadSortOrder('desc')
    setLeadPage(0)
  }

  const handleLeadStatusChange = async (leadId: string, statusId: string) => {
    setUpdatingLeadId(leadId)
    try {
      await updateLead(leadId, { statusId: statusId || undefined })
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, statusId: statusId || null } : l)),
      )
      toast.success('Статус обновлён')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setUpdatingLeadId(null)
    }
  }

  const handleLeadAssignedToChange = async (leadId: string, assignedTo: string[]) => {
    setUpdatingLeadId(leadId)
    try {
      await updateLead(leadId, { assignedTo })
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, assignedTo } : l)),
      )
      toast.success('Назначение обновлено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setUpdatingLeadId(null)
    }
  }

  const allSelectedOnPage = leads.length > 0 && leads.every((l) => selectedLeadIds.includes(l._id))
  const someSelected = selectedLeadIds.length > 0
  const toggleSelectAll = () => {
    if (allSelectedOnPage) setSelectedLeadIds([])
    else setSelectedLeadIds(leads.map((l) => l._id))
  }
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const handleBulkEditApply = async () => {
    if (!someSelected) return
    setBulkEditSaving(true)
    try {
      const payload: { statusId?: string; assignedTo?: string[] } = {}
      if (bulkEditStatusId !== '') payload.statusId = bulkEditStatusId === ' ' ? '' : bulkEditStatusId
      if (bulkEditChangeAssignees) payload.assignedTo = Array.isArray(bulkEditAssignedTo) ? bulkEditAssignedTo : []
      if (Object.keys(payload).length === 0) {
        toast.error('Выберите статус и/или отметьте «Изменить исполнителей»')
        setBulkEditSaving(false)
        return
      }
      const result = await bulkUpdateLeads(selectedLeadIds, payload)
      toast.success(`Обновлено лидов: ${result.updated}`)
      setBulkEditOpen(false)
      setSelectedLeadIds([])
      setBulkEditStatusId('')
      setBulkEditChangeAssignees(false)
      setBulkEditAssignedTo([])
      await refetchLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBulkEditSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return
    setBulkDeleteSaving(true)
    try {
      const result = await bulkDeleteLeads(selectedLeadIds)
      toast.success(`Удалено лидов: ${result.deleted}`)
      setBulkDeleteOpen(false)
      setSelectedLeadIds([])
      await refetchLeads()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setBulkDeleteSaving(false)
    }
  }

  const handleLeadPageChange = (_e: unknown, newPage: number) => setLeadPage(newPage)
  const handleLeadRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeadRowsPerPage(parseInt(e.target.value, 10))
    setLeadPage(0)
  }

  const openLeadCreate = () => {
    setLeadEditId(null)
    setLeadName('')
    setLeadPhone('')
    setLeadPhone2('')
    setLeadEmail('')
    setLeadEmail2('')
    setLeadStatusId('')
    setLeadAssignedTo([])
    setLeadLastName('')
    setLeadFormOpen(true)
  }

  const openLeadEdit = (lead: LeadItem) => {
    setLeadEditId(lead._id)
    setLeadName(lead.name)
    setLeadLastName(lead.lastName ?? '')
    setLeadPhone(lead.phone ?? '')
    setLeadPhone2(lead.phone2 ?? '')
    setLeadEmail(lead.email ?? '')
    setLeadEmail2(lead.email2 ?? '')
    setLeadStatusId(lead.statusId ?? '')
    setLeadAssignedTo(lead.assignedTo ?? [])
    setLeadFormOpen(true)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName.trim() || !selectedDepartmentId) return
    setLeadSaving(true)
    try {
      if (leadEditId) {
        await updateLead(leadEditId, {
          name: leadName.trim(),
          lastName: leadLastName.trim() || undefined,
          phone: leadPhone.trim() || undefined,
          phone2: leadPhone2.trim() || undefined,
          email: leadEmail.trim() || undefined,
          email2: leadEmail2.trim() || undefined,
          statusId: leadStatusId || undefined,
          assignedTo: leadAssignedTo,
        })
        toast.success('Лид обновлён')
      } else {
        await createLead({
          name: leadName.trim(),
          lastName: leadLastName.trim() || undefined,
          phone: leadPhone.trim() || undefined,
          phone2: leadPhone2.trim() || undefined,
          email: leadEmail.trim() || undefined,
          email2: leadEmail2.trim() || undefined,
          departmentId: selectedDepartmentId,
          statusId: leadStatusId || undefined,
          source: 'manual',
          assignedTo: leadAssignedTo,
        })
        toast.success('Лид создан')
      }
      await refetchLeads()
      setLeadFormOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLeadSaving(false)
    }
  }

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        if (isExcel) {
          const ab = reader.result as ArrayBuffer
          const wb = XLSX.read(ab, { type: 'array' })
          const firstSheet = wb.SheetNames[0]
          if (!firstSheet) {
            setBulkParsedItems(null)
            return
          }
          const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[firstSheet], { header: 1 })
          const items: { name: string; phone: string; email?: string }[] = []
          const headerLike = /^(имя|name|телефон|phone|почта|email|№)$/i
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] || []
            const name = String(row[0] ?? '').trim()
            const phone = String(row[1] ?? '').trim().replace(/\s/g, '')
            const email = String(row[2] ?? '').trim().toLowerCase()
            if (i === 0 && (headerLike.test(name) || headerLike.test(phone) || headerLike.test(email))) continue
            if (name && phone) items.push({ name, phone, email: email || undefined })
          }
          setBulkParsedItems(items)
        } else {
          const text = (reader.result as string) || ''
          setBulkParsedItems(parsePastedTable(text))
        }
        setBulkResult(null)
      } catch (err) {
        toast.error('Не удалось прочитать файл')
        setBulkParsedItems(null)
      }
    }
    if (isExcel) reader.readAsArrayBuffer(file)
    else reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const handleBulkSubmit = async () => {
    const items = bulkParsedItems ?? []
    if (!items.length) {
      toast.error('Сначала загрузите файл')
      return
    }
    if (!selectedDepartmentId) return
    setBulkSubmitting(true)
    setBulkResult(null)
    try {
      const result = await bulkCreateLeads(selectedDepartmentId, items)
      setBulkResult(result)
      await refetchLeads()
      if (result.added > 0 || result.duplicates > 0) {
        toast.success(`Добавлено: ${result.added}. Дубликатов (не добавлено): ${result.duplicates}.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBulkSubmitting(false)
    }
  }

  const handleLeadDelete = async () => {
    if (!leadDeleteId) return
    setLeadDeleting(true)
    try {
      await deleteLead(leadDeleteId)
      toast.success('Лид удалён')
      await refetchLeads()
      setLeadDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLeadDeleting(false)
    }
  }

  const canAccess =
    user?.role === 'super' ||
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    (user?.role === 'employee' && (user as { departmentId?: string }).departmentId)

  if (!canAccess) {
    return (
      <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2 }}>
          Лиды
        </Typography>
        <Typography color="rgba(255,255,255,0.6)">Нет доступа.</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        color: 'rgba(255,255,255,0.9)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 160px)',
        minHeight: 400,
      }}
    >
      <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600, mb: 2, flexShrink: 0 }}>
        Лиды
      </Typography>

      {loadingDepts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : departments.length === 0 ? (
        <Typography color="rgba(255,255,255,0.6)">Нет доступных отделов.</Typography>
      ) : (
        <>
          {departments.length > 1 && (
            <TextField
              select
              label="Отдел"
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, minWidth: 260, ...formFieldSx }}
              SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Лиды
              {leadTotal > 0 && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.5)' }}>
                  ({leadTotal})
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {!isEmployee && (
                <Button
                  size="small"
                  variant={leadScope === 'all' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setLeadScope('all')
                    setLeadPage(0)
                    setSearchParams((p) => {
                      const next = new URLSearchParams(p)
                      next.delete('scope')
                      return next
                    })
                  }}
                  sx={leadScope === 'all' ? { bgcolor: 'rgba(167,139,250,0.5)' } : { color: 'rgba(255,255,255,0.7)' }}
                >
                  Все лиды
                </Button>
              )}
              <Button
                size="small"
                variant={leadScope === 'mine' ? 'contained' : 'outlined'}
                onClick={() => {
                  setLeadScope('mine')
                  setLeadPage(0)
                  setSearchParams((p) => {
                    const next = new URLSearchParams(p)
                    next.set('scope', 'mine')
                    return next
                  })
                }}
                sx={leadScope === 'mine' ? { bgcolor: 'rgba(167,139,250,0.5)' } : { color: 'rgba(255,255,255,0.7)' }}
              >
                Мои лиды
              </Button>
              <Button
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => setFilterDrawerOpen(true)}
                sx={{ color: 'rgba(167,139,250,0.9)' }}
              >
                Фильтры
              </Button>
              {canCreateLead && (
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={openLeadCreate}
                  sx={{ color: 'rgba(167,139,250,0.9)' }}
                >
                  Добавить лид
                </Button>
              )}
              {canBulkCreateLeads && (
                <Button
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    setBulkParsedItems(null)
                    setBulkResult(null)
                    setBulkDialogOpen(true)
                  }}
                  sx={{ color: 'rgba(167,139,250,0.9)' }}
                >
                  Массовое добавление
                </Button>
              )}
            </Box>
          </Box>

          <Drawer
            anchor="right"
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: { xs: '100%', sm: '50%' },
                maxWidth: 480,
                bgcolor: 'rgba(15, 18, 32, 0.98)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              },
            }}
          >
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)' }}>
                  Фильтры и сортировка
                </Typography>
                <IconButton onClick={() => setFilterDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
                <TextField label="Имя" value={leadFilterName} onChange={(e) => { setLeadFilterName(e.target.value); setLeadPage(0) }} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} />
                <TextField label="Телефон" value={leadFilterPhone} onChange={(e) => { setLeadFilterPhone(e.target.value); setLeadPage(0) }} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} />
                <TextField label="Email" value={leadFilterEmail} onChange={(e) => { setLeadFilterEmail(e.target.value); setLeadPage(0) }} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} />
                <TextField select label="Статус" value={leadFilterStatusId} onChange={(e) => { setLeadFilterStatusId(e.target.value); setLeadPage(0) }} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} SelectProps={{ displayEmpty: true, sx: { color: 'rgba(255,255,255,0.95)' } }}>
                  <MenuItem value="">Все статусы</MenuItem>
                  {statuses.map((s) => (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
                </TextField>
                <TextField select label="Обрабатывает" value={leadFilterAssignedTo} onChange={(e) => { setLeadFilterAssignedTo(e.target.value); setLeadPage(0) }} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} SelectProps={{ displayEmpty: true, sx: { color: 'rgba(255,255,255,0.95)' } }}>
                  <MenuItem value="">Все исполнители</MenuItem>
                  {assigneeOptions.map((o) => (<MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>))}
                </TextField>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                  <DatePicker
                    label="Дата от (создан)"
                    value={leadFilterDateFrom ? dayjs(leadFilterDateFrom) : null}
                    onChange={(val: Dayjs | null) => {
                      setLeadFilterDateFrom(val ? val.format('YYYY-MM-DD') : '')
                      setLeadPage(0)
                    }}
                    slotProps={{
                      popper: {
                        sx: {
                          '& .MuiPaper-root': {
                            minWidth: 360,
                            p: 2,
                            '& .MuiDayCalendar-monthContainer': { width: '100%' },
                            '& .MuiPickersDay-root': { width: 48, height: 48, fontSize: '1.05rem' },
                            '& .MuiPickersCalendarHeader-label': { fontSize: '1.25rem' },
                            '& .MuiDayCalendar-weekDayLabel': { width: 48, height: 40, fontSize: '1rem' },
                          },
                        },
                      },
                    }}
                    sx={formFieldSx}
                  />
                  <DatePicker
                    label="Дата по (создан)"
                    value={leadFilterDateTo ? dayjs(leadFilterDateTo) : null}
                    onChange={(val: Dayjs | null) => {
                      setLeadFilterDateTo(val ? val.format('YYYY-MM-DD') : '')
                      setLeadPage(0)
                    }}
                    slotProps={{
                      popper: {
                        sx: {
                          '& .MuiPaper-root': {
                            minWidth: 360,
                            p: 2,
                            '& .MuiDayCalendar-monthContainer': { width: '100%' },
                            '& .MuiPickersDay-root': { width: 48, height: 48, fontSize: '1.05rem' },
                            '& .MuiPickersCalendarHeader-label': { fontSize: '1.25rem' },
                            '& .MuiDayCalendar-weekDayLabel': { width: 48, height: 40, fontSize: '1rem' },
                          },
                        },
                      },
                    }}
                    sx={formFieldSx}
                  />
                </LocalizationProvider>
                <TextField select label="Сортировка" value={leadSortBy} onChange={(e) => { setLeadSortBy(e.target.value); setLeadPage(0) }} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}>
                  <MenuItem value="createdAt">По дате создания</MenuItem>
                  <MenuItem value="updatedAt">По дате изменения</MenuItem>
                  <MenuItem value="name">По имени</MenuItem>
                  <MenuItem value="phone">По телефону</MenuItem>
                  <MenuItem value="email">По email</MenuItem>
                  <MenuItem value="statusId">По статусу</MenuItem>
                </TextField>
                <TextField select label="Порядок" value={leadSortOrder} onChange={(e) => { setLeadSortOrder(e.target.value as 'asc' | 'desc'); setLeadPage(0) }} InputLabelProps={{ shrink: true }} fullWidth sx={formFieldSx} SelectProps={{ sx: { color: 'rgba(255,255,255,0.95)' } }}>
                  <MenuItem value="desc">По убыванию</MenuItem>
                  <MenuItem value="asc">По возрастанию</MenuItem>
                </TextField>
              </Box>
              <Button fullWidth variant="outlined" onClick={resetLeadFilters} sx={{ mt: 2, color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.3)' }}>
                Сбросить фильтры
              </Button>
            </Box>
          </Drawer>

          {(canBulkEditLeads || canBulkDeleteLeads) && someSelected && (
            <Paper sx={{ p: 1.5, mb: 1, bgcolor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 2, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>Выбрано: {selectedLeadIds.length}</Typography>
                {canBulkEditLeads && (
                  <Button size="small" variant="outlined" onClick={() => setBulkEditOpen(true)} sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.5)' }}>
                    Изменить статус / исполнителей
                  </Button>
                )}
                {canBulkDeleteLeads && (
                  <Button size="small" variant="outlined" color="error" onClick={() => setBulkDeleteOpen(true)}>
                    Удалить выбранные
                  </Button>
                )}
                <Button size="small" onClick={() => setSelectedLeadIds([])} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Снять выделение
                </Button>
              </Box>
            </Paper>
          )}

          <TableContainer
            component={Paper}
            sx={{
              flex: 1,
              minHeight: 0,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              overflow: 'auto',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {canBulkEditLeads && (
                    <TableCell padding="checkbox" sx={{ bgcolor: 'rgba(255,255,255,0.04)' }}>
                      <Checkbox
                        indeterminate={someSelected && !allSelectedOnPage}
                        checked={allSelectedOnPage}
                        onChange={toggleSelectAll}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Имя</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Фамилия</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Телефон</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Email</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Статус</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Обрабатывает</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)' }}>Создан</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.04)', p: 0, verticalAlign: 'middle' }}>
                    <Tooltip title={leadSortBy === 'updatedAt' ? (leadSortOrder === 'desc' ? 'Сначала новые (клик — по старым)' : 'Сначала старые (клик — по новым)') : 'Сортировка по дате изменения'}>
                      <Button
                        size="small"
                        endIcon={
                          leadSortBy === 'updatedAt' ? (
                            leadSortOrder === 'desc' ? (
                              <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                            ) : (
                              <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                            )
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                          )
                        }
                        onClick={() => {
                          if (leadSortBy === 'updatedAt') {
                            setLeadSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))
                          } else {
                            setLeadSortBy('updatedAt')
                            setLeadSortOrder('desc')
                          }
                          setLeadPage(0)
                        }}
                        sx={{
                          color: leadSortBy === 'updatedAt' ? 'rgba(167,139,250,0.95)' : 'rgba(255,255,255,0.6)',
                          textTransform: 'none',
                          minWidth: 0,
                          py: 0.5,
                          px: 1,
                        }}
                      >
                        Изменён
                      </Button>
                    </Tooltip>
                  </TableCell>
                  {canCreateLead && (
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)', width: 56, bgcolor: 'rgba(255,255,255,0.04)' }} align="right" />
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {leadLoading && leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8 + (canBulkEditLeads ? 1 : 0) + (canCreateLead ? 1 : 0)} sx={{ py: 2, textAlign: 'center' }}>
                      <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8 + (canBulkEditLeads ? 1 : 0) + (canCreateLead ? 1 : 0)} sx={{ color: 'rgba(255,255,255,0.5)', py: 2, textAlign: 'center' }}>
                      {canCreateLead ? 'Нет лидов. Нажмите «Добавить лид».' : 'Нет лидов.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                      {canBulkEditLeads && (
                        <TableCell padding="checkbox" sx={{ py: 0 }}>
                          <Checkbox
                            checked={selectedLeadIds.includes(lead._id)}
                            onChange={() => toggleSelectLead(lead._id)}
                            sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
                          />
                        </TableCell>
                      )}
                      <TableCell
                        sx={{ color: 'rgba(255,255,255,0.95)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                        onClick={() => navigate(`/leads/${lead._id}${selectedDepartmentId ? `?departmentId=${selectedDepartmentId}` : ''}`)}
                      >
                        {lead.name}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{lead.lastName || '—'}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'top', py: 0.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Tooltip title={lead.phone ? 'Нажмите, чтобы скопировать' : ''}>
                            <Box
                              component="span"
                              sx={{ ...(lead.phone && { cursor: 'pointer', '&:hover': { color: 'rgba(167,139,250,0.9)' } }) }}
                              onClick={(e) => { e.stopPropagation(); if (lead.phone?.trim()) { navigator.clipboard.writeText(lead.phone.trim()); toast.success('Телефон скопирован') } }}
                            >
                              {lead.phone || '—'}
                            </Box>
                          </Tooltip>
                          {(lead.phone2 ?? '').trim() ? (
                            <Tooltip title="Нажмите, чтобы скопировать">
                              <Box
                                component="span"
                                sx={{ fontSize: '0.85rem', opacity: 0.9, cursor: 'pointer', '&:hover': { color: 'rgba(167,139,250,0.9)' } }}
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((lead.phone2 ?? '').trim()); toast.success('Телефон 2 скопирован') }}
                              >
                                {lead.phone2?.trim()}
                              </Box>
                            </Tooltip>
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)', verticalAlign: 'top', py: 0.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Tooltip title={lead.email ? 'Нажмите, чтобы скопировать' : ''}>
                            <Box
                              component="span"
                              sx={{ ...(lead.email && { cursor: 'pointer', '&:hover': { color: 'rgba(167,139,250,0.9)' } }) }}
                              onClick={(e) => { e.stopPropagation(); if (lead.email?.trim()) { navigator.clipboard.writeText(lead.email.trim()); toast.success('Email скопирован') } }}
                            >
                              {lead.email || '—'}
                            </Box>
                          </Tooltip>
                          {(lead.email2 ?? '').trim() ? (
                            <Tooltip title="Нажмите, чтобы скопировать">
                              <Box
                                component="span"
                                sx={{ fontSize: '0.85rem', opacity: 0.9, cursor: 'pointer', '&:hover': { color: 'rgba(167,139,250,0.9)' } }}
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((lead.email2 ?? '').trim()); toast.success('Email 2 скопирован') }}
                              >
                                {lead.email2?.trim()}
                              </Box>
                            </Tooltip>
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {canCreateLead ? (
                          <Select
                            size="small"
                            value={lead.statusId ?? ''}
                            onChange={(e) => handleLeadStatusChange(lead._id, e.target.value)}
                            disabled={updatingLeadId === lead._id}
                            displayEmpty
                            sx={{
                              minWidth: 140,
                              color: 'rgba(255,255,255,0.95)',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                              '& .MuiSelect-select': { py: 0.5 },
                            }}
                            renderValue={(v) => {
                              if (!v) return '— Не выбран'
                              const st = statuses.find((s) => s._id === v)
                              if (!st) return '—'
                              return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: st.color || '#9ca3af', flexShrink: 0 }} />
                                  <span>{st.name}</span>
                                </Box>
                              )
                            }}
                          >
                            <MenuItem value="">— Не выбран</MenuItem>
                            {statuses.map((s) => (
                              <MenuItem key={s._id} value={s._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color || '#9ca3af', flexShrink: 0 }} />
                                  <span>{s.name}</span>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        ) : lead.statusId ? (() => {
                          const st = statuses.find((s) => s._id === lead.statusId)
                          if (!st) return '—'
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: st.color || '#9ca3af', flexShrink: 0 }} />
                              <span>{st.name}</span>
                            </Box>
                          )
                        })() : '—'}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {canCreateLead ? (
                          isEmployee ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {lead.assignedTo?.includes(user?.userId ?? '') ? (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>На мне</Typography>
                              ) : (
                                <Button size="small" variant="outlined" onClick={() => handleLeadAssignedToChange(lead._id, user?.userId ? [user.userId] : [])} disabled={updatingLeadId === lead._id} sx={{ borderColor: 'rgba(167,139,250,0.5)', color: 'rgba(167,139,250,0.95)' }}>Взять на себя</Button>
                              )}
                            </Box>
                          ) : (
                            <Select
                              size="small"
                              multiple
                              value={lead.assignedTo ?? []}
                              onChange={(e) => handleLeadAssignedToChange(lead._id, e.target.value as string[])}
                              disabled={updatingLeadId === lead._id}
                              displayEmpty
                              sx={{
                                minWidth: 140,
                                color: 'rgba(255,255,255,0.95)',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                '& .MuiSelect-select': { py: 0.5 },
                              }}
                              renderValue={(selected) =>
                                (selected as string[]).length
                                  ? (selected as string[]).map((id) => assigneeNameMap[id] || id).join(', ')
                                  : '— Никого'
                              }
                            >
                              {assigneeOptions.map((o) => (
                                <MenuItem key={o.id} value={o.id}>
                                  {o.label}
                                </MenuItem>
                              ))}
                            </Select>
                          )
                        ) : lead.assignedTo?.length
                          ? (lead.assignedTo.map((id) => assigneeNameMap[id]).filter(Boolean).join(', ') || '—')
                          : '—'}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{formatDateTime(lead.createdAt)}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{formatDateTime(lead.updatedAt)}</TableCell>
                      {canCreateLead && (
                        <TableCell align="right" sx={{ py: 0 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 0 }}>
                            <Tooltip title="Редактировать">
                              <IconButton size="small" onClick={() => openLeadEdit(lead)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить">
                              <IconButton size="small" onClick={() => setLeadDeleteId(lead._id)} sx={{ color: 'rgba(248,113,113,0.8)' }}>
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

          <TablePagination
            component="div"
            count={leadTotal}
            page={leadPage}
            onPageChange={handleLeadPageChange}
            rowsPerPage={leadRowsPerPage}
            onRowsPerPageChange={handleLeadRowsPerPageChange}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            labelRowsPerPage="Строк на странице:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`}
            sx={{
              flexShrink: 0,
              color: 'rgba(255,255,255,0.8)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              '& .MuiTablePagination-selectIcon': { color: 'rgba(255,255,255,0.8)' },
            }}
          />
        </>
      )}

      <Dialog
        open={leadFormOpen}
        onClose={() => !leadSaving && setLeadFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>
          {leadEditId ? 'Редактировать лид' : 'Новый лид'}
        </DialogTitle>
        <Box component="form" onSubmit={handleLeadSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              label="Имя"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Фамилия"
              value={leadLastName}
              onChange={(e) => setLeadLastName(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Телефон"
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Телефон 2"
              value={leadPhone2}
              onChange={(e) => setLeadPhone2(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Email"
              type="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              label="Email 2"
              type="email"
              value={leadEmail2}
              onChange={(e) => setLeadEmail2(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
            />
            <TextField
              select
              label="Статус"
              value={leadStatusId}
              onChange={(e) => setLeadStatusId(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, ...formFieldSx }}
              SelectProps={{
                sx: { color: 'rgba(255,255,255,0.95)' },
                renderValue: (v) => {
                  if (!v) return '— Не выбран'
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
              <MenuItem value="">— Не выбран</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color || '#9ca3af', flexShrink: 0 }} />
                    <span>{s.name}</span>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            {assigneeOptions.length > 0 && (
              isEmployee ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Обрабатывает</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                    {leadAssignedTo?.length ? leadAssignedTo.map((id) => assigneeNameMap[id] || id).join(', ') : '— Никого'}
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => setLeadAssignedTo(user?.userId ? [user.userId] : [])} sx={{ mt: 1, borderColor: 'rgba(167,139,250,0.5)', color: 'rgba(167,139,250,0.95)' }}>
                    Взять на себя
                  </Button>
                </Box>
              ) : (
                <TextField
                  select
                  SelectProps={{
                    multiple: true,
                    sx: { color: 'rgba(255,255,255,0.95)' },
                    renderValue: (selected: unknown) =>
                      (selected as string[]).length
                        ? (selected as string[]).map((id) => assigneeNameMap[id] || id).join(', ')
                        : '— Никого',
                  }}
                  label="Обрабатывает"
                  value={leadAssignedTo}
                  onChange={(e) => setLeadAssignedTo(Array.isArray(e.target.value) ? e.target.value : [])}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2, ...formFieldSx }}
                >
                  {assigneeOptions.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setLeadFormOpen(false)} disabled={leadSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={leadSaving || !leadName.trim()}
              sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
            >
              {leadSaving ? 'Сохранение…' : leadEditId ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={!!leadDeleteId}
        onClose={() => !leadDeleting && setLeadDeleteId(null)}
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить лид?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Лид будет удалён. Действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLeadDeleteId(null)} disabled={leadDeleting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleLeadDelete}
            disabled={leadDeleting}
            sx={{ bgcolor: 'rgba(248,113,113,0.9)', '&:hover': { bgcolor: 'rgba(248,113,113,1)' } }}
          >
            {leadDeleting ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkEditOpen}
        onClose={() => !bulkEditSaving && setBulkEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Массовое редактирование ({selectedLeadIds.length} лидов)</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            select
            fullWidth
            label="Установить статус"
            value={bulkEditStatusId === '' ? '__none__' : bulkEditStatusId}
            onChange={(e) => setBulkEditStatusId(e.target.value === '__none__' ? '' : e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2, ...formFieldSx }}
            SelectProps={{
              sx: { color: 'rgba(255,255,255,0.95)' },
              renderValue: (v) => {
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Checkbox
              checked={bulkEditChangeAssignees}
              onChange={(e) => setBulkEditChangeAssignees(e.target.checked)}
              sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-checked': { color: 'rgba(167,139,250,0.9)' } }}
            />
            <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>Изменить исполнителей</Typography>
          </Box>
          {bulkEditChangeAssignees && (
            <FormControl fullWidth sx={{ mb: 2, ...formFieldSx }}>
              <InputLabel id="bulk-edit-assignees-label" shrink>Исполнители</InputLabel>
              <Select
                labelId="bulk-edit-assignees-label"
                label="Исполнители"
                multiple
                value={bulkEditAssignedToSafe}
                onChange={(e) => {
                  const v = e.target.value
                  const next = Array.isArray(v) ? v : (v === undefined || v === null ? [] : [String(v)])
                  setBulkEditAssignedTo(next)
                }}
                renderValue={(selected) => {
                  const arr = Array.isArray(selected) ? selected : []
                  if (!arr.length) return '— Никого'
                  return arr.map((id) => assigneeNameMap[id] || id).join(', ')
                }}
                variant="outlined"
                sx={{ color: 'rgba(255,255,255,0.95)' }}
              >
                {assigneeOptions.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Статус: «Не менять» — не трогать; «Сбросить» — убрать статус. Исполнители: если включено и пусто — снять назначение.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkEditOpen(false)} disabled={bulkEditSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkEditApply}
            disabled={bulkEditSaving}
            sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
          >
            {bulkEditSaving ? 'Сохранение…' : 'Применить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkDeleteOpen}
        onClose={() => !bulkDeleteSaving && setBulkDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Удалить выбранные лиды?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Будет удалено лидов: <strong>{selectedLeadIds.length}</strong>. Отменить действие нельзя.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteSaving} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            disabled={bulkDeleteSaving}
          >
            {bulkDeleteSaving ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkDialogOpen}
        onClose={() => !bulkSubmitting && setBulkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(18, 22, 36, 0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.95)' }}>Массовое добавление лидов</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Загрузите файл (Excel .xlsx, CSV, TXT): 1-й столбец — имя, 2-й — телефон, 3-й — почта (необязательно). Дубликаты по телефону в отделе не добавляются.
          </Typography>
          <input
            type="file"
            ref={bulkFileInputRef}
            accept=".csv,.txt,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            style={{ display: 'none' }}
            onChange={handleBulkFileChange}
          />
          <Button
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => bulkFileInputRef.current?.click()}
            disabled={bulkSubmitting}
            sx={{ mb: 2, color: 'rgba(167,139,250,0.9)' }}
          >
            Загрузить из файла
          </Button>
          {bulkParsedItems !== null && bulkParsedItems.length > 0 && (
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Загружено строк: {bulkParsedItems.length}
            </Typography>
          )}
          {bulkResult !== null && (
            <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.9)' }}>
              Добавлено: <strong>{bulkResult.added}</strong>. Дубликатов (не добавлено): <strong>{bulkResult.duplicates}</strong>.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDialogOpen(false)} disabled={bulkSubmitting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Закрыть
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkSubmit}
            disabled={bulkSubmitting || !bulkParsedItems?.length}
            sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
          >
            {bulkSubmitting ? 'Импорт…' : 'Импортировать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeadsPage
