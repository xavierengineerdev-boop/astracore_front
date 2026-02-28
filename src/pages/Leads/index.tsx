import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Box, Typography, TextField, MenuItem, Button, CircularProgress, InputAdornment } from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import UploadIcon from '@mui/icons-material/Upload'
import FilterListIcon from '@mui/icons-material/FilterList'
import SearchIcon from '@mui/icons-material/Search'
import BackButton from '@/components/BackButton'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getDepartments, getDepartment, type DepartmentItem, type DepartmentDetail } from '@/api/departments'
import { getStatusesByDepartment, type StatusItem } from '@/api/statuses'
import { getLeadTagsByDepartment, type LeadTagItem } from '@/api/leadTags'
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
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import {
  LeadsFiltersDrawer,
  LeadsBulkBar,
  LeadsTable,
  LeadFormDialog,
  LeadDeleteDialog,
  LeadCommentPopup,
  BulkEditDialog,
  BulkDeleteDialog,
  BulkImportDialog,
} from './components'

const ROWS_PER_PAGE_OPTIONS_ARR = [10, 25, 50, 100, 500, 1000]

/** Обновить query в URL, сохраняя остальные параметры (для своей вкладки и перезагрузки) */
function mergeSearchParams(
  prev: URLSearchParams,
  updates: Record<string, string | number | undefined>,
): URLSearchParams {
  const p = new URLSearchParams(prev)
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === '' || (key === 'page' && Number(value) === 0) || (key === 'limit' && Number(value) === 25)) {
      p.delete(key)
    } else {
      p.set(key, String(value))
    }
  })
  return p
}

const LeadsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  // Сотрудник видит только свои лиды; руководитель, админ, супер — «Неназначенные» / «Все лиды отдела» / «Мои»
  const scopeParam = searchParams.get('scope')
  const scopeFromUrl: 'all' | 'department' | 'mine' =
    scopeParam === 'mine' ? 'mine' : scopeParam === 'department' ? 'department' : 'all'
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadTotal, setLeadTotal] = useState(0)

  // Состояние фильтров и пагинации из URL — каждая вкладка и перезагрузка сохраняют свой набор
  const leadPage = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0)
  const leadRowsPerPageRaw = parseInt(searchParams.get('limit') ?? '25', 10) || 25
  const leadRowsPerPage = ROWS_PER_PAGE_OPTIONS_ARR.includes(leadRowsPerPageRaw) ? leadRowsPerPageRaw : 25
  const leadFilterName = searchParams.get('search') ?? ''
  const leadFilterPhone = searchParams.get('phone') ?? ''
  const leadFilterEmail = searchParams.get('email') ?? ''
  const leadFilterStatusId = searchParams.get('statusId') ?? ''
  const leadFilterLeadTagId = searchParams.get('leadTagId') ?? ''
  const leadFilterAssignedTo = searchParams.get('assignedTo') ?? ''
  const leadFilterDateFrom = searchParams.get('dateFrom') ?? ''
  const leadFilterDateTo = searchParams.get('dateTo') ?? ''
  const leadSortBy = (searchParams.get('sortBy') ?? 'createdAt').trim() || 'createdAt'
  const leadSortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  const leadScope = user?.role === 'employee' ? 'mine' : scopeFromUrl

  const setLeadPage = (page: number) => setSearchParams((prev) => mergeSearchParams(prev, { page: page <= 0 ? undefined : page }))
  const setLeadRowsPerPage = (limit: number) => setSearchParams((prev) => mergeSearchParams(prev, { limit: limit === 25 ? undefined : limit, page: 0 }))
  const setLeadFilterName = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { search: v.trim() || undefined, page: 0 }))
  const setLeadFilterPhone = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { phone: v.trim() || undefined, page: 0 }))
  const setLeadFilterEmail = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { email: v.trim() || undefined, page: 0 }))
  const setLeadFilterStatusId = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { statusId: v.trim() || undefined, page: 0 }))
  const setLeadFilterLeadTagId = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { leadTagId: v.trim() || undefined, page: 0 }))
  const setLeadFilterAssignedTo = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { assignedTo: v.trim() || undefined, page: 0 }))
  const setLeadFilterDateFrom = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { dateFrom: v.trim() || undefined, page: 0 }))
  const setLeadFilterDateTo = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { dateTo: v.trim() || undefined, page: 0 }))
  const setLeadSortBy = (v: string) => setSearchParams((prev) => mergeSearchParams(prev, { sortBy: v === 'createdAt' ? undefined : v, page: 0 }))
  const setLeadSortOrder = (v: 'asc' | 'desc') => setSearchParams((prev) => mergeSearchParams(prev, { sortOrder: v === 'desc' ? undefined : v, page: 0 }))
  const setLeadScope = (scope: 'all' | 'department' | 'mine') => {
    if (user?.role === 'employee') return
    setSearchParams((prev) => mergeSearchParams(prev, { scope: scope === 'all' ? undefined : scope, page: 0 }))
  }
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditStatusId, setBulkEditStatusId] = useState('')
  const [bulkEditLeadTagId, setBulkEditLeadTagId] = useState('')
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
  const [leadTagId, setLeadTagId] = useState('')
  const [leadAssignedTo, setLeadAssignedTo] = useState<string[]>([])
  const [leadSaving, setLeadSaving] = useState(false)
  const [departmentDetail, setDepartmentDetail] = useState<DepartmentDetail | null>(null)
  const [departmentLeadTags, setDepartmentLeadTags] = useState<LeadTagItem[]>([])
  const [leadDeleteId, setLeadDeleteId] = useState<string | null>(null)
  const [leadDeleting, setLeadDeleting] = useState(false)
  const [commentPopupLead, setCommentPopupLead] = useState<LeadItem | null>(null)
  const [commentPopupValue, setCommentPopupValue] = useState('')
  const [commentPopupSaving, setCommentPopupSaving] = useState(false)
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkParsedItems, setBulkParsedItems] = useState<{ name: string; phone: string; email?: string }[] | null>(null)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ added: number; duplicates: number } | null>(null)
  const [selectingAllIds, setSelectingAllIds] = useState(false)
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
  const canBulkEditLeads = user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager'
  const canBulkDeleteLeads = user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager'
  const canBulkCreateLeads = user?.role === 'super' || user?.role === 'manager'
  const isEmployee = user?.role === 'employee'
  const editingLead = leadEditId ? leads.find((l) => l._id === leadEditId) ?? null : null

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

  const leadTagMap = useMemo(() => {
    const m: Record<string, { name: string; color: string }> = {}
    departmentLeadTags.forEach((t) => { m[t._id] = { name: t.name, color: t.color || '#9ca3af' } })
    return m
  }, [departmentLeadTags])

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
            if (!searchParams.get('departmentId')) setSearchParams((prev) => mergeSearchParams(prev, { departmentId: d._id }))
          }
        })
        .catch(() => { if (!cancelled) setDepartments([]) })
        .finally(() => { if (!cancelled) setLoadingDepts(false) })
    } else if (user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager') {
      getDepartments()
        .then((list) => {
          if (!cancelled) {
            const managerDeptId = user?.role === 'manager' ? (user as { departmentId?: string }).departmentId : undefined
            const filtered =
              managerDeptId
                ? list.filter((d) => String(d._id) === String(managerDeptId))
                : list
            setDepartments(filtered)
            if (filtered.length > 0 && !selectedDepartmentId) {
              const firstId = filtered[0]._id
              setSelectedDepartmentId(firstId)
              if (!searchParams.get('departmentId')) setSearchParams((prev) => mergeSearchParams(prev, { departmentId: firstId }))
            }
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
    if (!selectedDepartmentId) {
      setDepartmentLeadTags([])
      return
    }
    let cancelled = false
    getLeadTagsByDepartment(selectedDepartmentId)
      .then((tags) => { if (!cancelled) setDepartmentLeadTags(tags) })
      .catch(() => { if (!cancelled) setDepartmentLeadTags([]) })
    return () => { cancelled = true }
  }, [selectedDepartmentId])

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
    // «Неназначенные» — только лиды без исполнителя; при фильтре «Обрабатывает» — лиды этого исполнителя.
    // «Все лиды отдела» — все лиды отдела (руководитель/админ/супер).
    // «Мои лиды» — лиды, назначенные на текущего пользователя.
    const assignedToParam =
      leadScope === 'mine' && user?.userId
        ? user.userId
        : leadFilterAssignedTo?.trim() || undefined
    const unassignedOnly = leadScope === 'all' && !assignedToParam
    const filterParams = {
      skip: pageToUse * leadRowsPerPage,
      limit: leadRowsPerPage,
      ...(leadFilterName.trim() && { search: leadFilterName.trim() }),
      ...(!leadFilterName.trim() && leadFilterPhone.trim() && { phone: leadFilterPhone.trim() }),
      ...(!leadFilterName.trim() && leadFilterEmail.trim() && { email: leadFilterEmail.trim() }),
      ...(leadFilterStatusId && { statusId: leadFilterStatusId }),
      ...(leadFilterLeadTagId && { leadTagId: leadFilterLeadTagId }),
      ...(assignedToParam && { assignedTo: assignedToParam }),
      ...(unassignedOnly && { unassignedOnly: true }),
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
    leadFilterLeadTagId,
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
      const assignedToParam =
        leadScope === 'mine' && user?.userId
          ? user.userId
          : leadFilterAssignedTo?.trim() || undefined
      const unassignedOnly = leadScope === 'all' && !assignedToParam
      const data = await getLeadsByDepartment(selectedDepartmentId, {
        skip: leadPage * leadRowsPerPage,
        limit: leadRowsPerPage,
        ...(leadFilterName.trim() && { search: leadFilterName.trim() }),
        ...(!leadFilterName.trim() && leadFilterPhone.trim() && { phone: leadFilterPhone.trim() }),
        ...(!leadFilterName.trim() && leadFilterEmail.trim() && { email: leadFilterEmail.trim() }),
        ...(leadFilterStatusId && { statusId: leadFilterStatusId }),
        ...(leadFilterLeadTagId && { leadTagId: leadFilterLeadTagId }),
        ...(assignedToParam && { assignedTo: assignedToParam }),
        ...(unassignedOnly && { unassignedOnly: true }),
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
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      ;['search', 'phone', 'email', 'statusId', 'leadTagId', 'assignedTo', 'dateFrom', 'dateTo', 'sortBy', 'sortOrder', 'page'].forEach((k) => p.delete(k))
      return p
    })
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

  const handleLeadTagChange = async (leadId: string, leadTagId: string | null) => {
    setUpdatingLeadId(leadId)
    try {
      await updateLead(leadId, { leadTagId })
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, leadTagId: leadTagId ?? undefined } : l)),
      )
      toast.success('Источник обновлён')
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
      const isUnassignedOnlyList = leadScope === 'all' && !leadFilterAssignedTo?.trim()
      if (isUnassignedOnlyList && assignedTo.length > 0) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId))
        setLeadTotal((prev) => Math.max(0, prev - 1))
      } else {
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? { ...l, assignedTo } : l)),
        )
      }
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

  const selectAllMatchingFilters = async () => {
    if (!selectedDepartmentId || leadTotal <= 0) return
    setSelectingAllIds(true)
    try {
      const assignedToParam =
        leadScope === 'mine' && user?.userId
          ? user.userId
          : leadFilterAssignedTo?.trim() || undefined
      const unassignedOnly = leadScope === 'all' && !assignedToParam
      const baseParams = {
        ...(leadFilterName.trim() && { search: leadFilterName.trim() }),
        ...(!leadFilterName.trim() && leadFilterPhone.trim() && { phone: leadFilterPhone.trim() }),
        ...(!leadFilterName.trim() && leadFilterEmail.trim() && { email: leadFilterEmail.trim() }),
        ...(leadFilterStatusId && { statusId: leadFilterStatusId }),
        ...(leadFilterLeadTagId && { leadTagId: leadFilterLeadTagId }),
        ...(assignedToParam && { assignedTo: assignedToParam }),
        ...(unassignedOnly && { unassignedOnly: true }),
        ...(leadFilterDateFrom.trim() && { dateFrom: leadFilterDateFrom.trim() }),
        ...(leadFilterDateTo.trim() && { dateTo: leadFilterDateTo.trim() }),
        sortBy: leadSortBy,
        sortOrder: leadSortOrder,
      }
      const chunkSize = 100
      let allIds: string[] = []
      let skip = 0
      while (skip < leadTotal) {
        const data = await getLeadsByDepartment(selectedDepartmentId, {
          skip,
          limit: chunkSize,
          ...baseParams,
        })
        allIds = allIds.concat(data.items.map((i) => i._id))
        if (data.items.length < chunkSize) break
        skip += chunkSize
      }
      setSelectedLeadIds(allIds)
      toast.success(`Выбрано лидов: ${allIds.length}`)
    } catch {
      toast.error('Не удалось загрузить список лидов')
    } finally {
      setSelectingAllIds(false)
    }
  }
  const handleBulkEditApply = async () => {
    if (!someSelected) return
    setBulkEditSaving(true)
    try {
      const payload: { statusId?: string; assignedTo?: string[]; leadTagId?: string | null } = {}
      if (bulkEditStatusId !== '') payload.statusId = bulkEditStatusId === ' ' ? '' : bulkEditStatusId
      if (bulkEditLeadTagId !== '' && bulkEditLeadTagId !== '__none__') {
        payload.leadTagId = bulkEditLeadTagId === ' ' ? null : bulkEditLeadTagId
      }
      if (bulkEditChangeAssignees) payload.assignedTo = Array.isArray(bulkEditAssignedTo) ? bulkEditAssignedTo : []
      if (Object.keys(payload).length === 0) {
        toast.error('Выберите статус, источник и/или отметьте «Изменить исполнителей»')
        setBulkEditSaving(false)
        return
      }
      const result = await bulkUpdateLeads(selectedLeadIds, payload)
      toast.success(`Обновлено лидов: ${result.updated}`)
      setBulkEditOpen(false)
      setSelectedLeadIds([])
      setBulkEditStatusId('')
      setBulkEditLeadTagId('')
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
  }

  const openLeadCreate = () => {
    setLeadEditId(null)
    setLeadName('')
    setLeadPhone('')
    setLeadPhone2('')
    setLeadEmail('')
    setLeadEmail2('')
    setLeadStatusId('')
    setLeadTagId('')
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
    setLeadTagId(lead.leadTagId ?? '')
    setLeadAssignedTo(lead.assignedTo ?? [])
    setLeadFormOpen(true)
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName.trim() || !selectedDepartmentId) return
    setLeadSaving(true)
    try {
      if (leadEditId) {
        const updatePayload: Parameters<typeof updateLead>[1] = {
          name: leadName.trim(),
          lastName: leadLastName.trim() || undefined,
          email: leadEmail.trim() || undefined,
          email2: leadEmail2.trim() || undefined,
          statusId: leadStatusId || undefined,
          assignedTo: leadAssignedTo,
          leadTagId: leadTagId || null,
        }
        if (!isEmployee) {
          updatePayload.phone = leadPhone.trim() || undefined
          updatePayload.phone2 = leadPhone2.trim() || undefined
        } else {
          if (!editingLead?.phone?.trim()) updatePayload.phone = leadPhone.trim() || undefined
          if (!editingLead?.phone2?.trim()) updatePayload.phone2 = leadPhone2.trim() || undefined
        }
        await updateLead(leadEditId, updatePayload)
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
          leadTagId: leadTagId || undefined,
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

  const openCommentPopup = (lead: LeadItem) => {
    setCommentPopupLead(lead)
    setCommentPopupValue('') // всегда пустое поле — чтобы добавить новый комментарий
  }

  const handleCommentPopupSave = async () => {
    if (!commentPopupLead) return
    setCommentPopupSaving(true)
    try {
      await updateLead(commentPopupLead._id, { comment: commentPopupValue.trim() })
      toast.success('Комментарий сохранён')
      await refetchLeads()
      setCommentPopupLead(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCommentPopupSaving(false)
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
        height: 'calc(100vh - 120px)',
        minHeight: 500,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2, flexShrink: 0 }}>
        <BackButton fallbackTo="/" />
        <Typography variant="h5" sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600 }}>
          Лиды
        </Typography>
      </Box>

      {loadingDepts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : departments.length === 0 ? (
        <Typography color="rgba(255,255,255,0.6)">Нет доступных отделов.</Typography>
      ) : (
        <>
          {(user?.role === 'super' || user?.role === 'admin') && departments.length > 1 && (
            <TextField
              select
              label="Отдел"
              value={selectedDepartmentId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedDepartmentId(id)
                setSearchParams((prev) => mergeSearchParams(prev, { departmentId: id || undefined, page: 0 }))
              }}
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
            <TextField
              size="small"
              placeholder="Поиск по имени, телефону, email…"
              value={leadFilterName}
              onChange={(e) => setLeadFilterName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { color: 'rgba(255,255,255,0.95)', '& input': { py: 0.75 } },
              }}
              sx={{
                minWidth: 260,
                maxWidth: 320,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                  '&.Mui-focused fieldset': { borderColor: 'rgba(167,139,250,0.6)' },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {!isEmployee && (
                <>
                  <Button
                    size="small"
                    variant={leadScope === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setLeadScope('all')}
                    sx={leadScope === 'all' ? { bgcolor: 'rgba(167,139,250,0.5)' } : { color: 'rgba(255,255,255,0.7)' }}
                  >
                    Неназначенные
                  </Button>
                  <Button
                    size="small"
                    variant={leadScope === 'department' ? 'contained' : 'outlined'}
                    onClick={() => setLeadScope('department')}
                    sx={leadScope === 'department' ? { bgcolor: 'rgba(167,139,250,0.5)' } : { color: 'rgba(255,255,255,0.7)' }}
                  >
                    Все лиды отдела
                  </Button>
                </>
              )}
              <Button
                size="small"
                variant={leadScope === 'mine' ? 'contained' : 'outlined'}
                onClick={() => setLeadScope('mine')}
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

          <LeadsFiltersDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            name={leadFilterName}
            onNameChange={setLeadFilterName}
            phone={leadFilterPhone}
            onPhoneChange={setLeadFilterPhone}
            email={leadFilterEmail}
            onEmailChange={setLeadFilterEmail}
            statusId={leadFilterStatusId}
            onStatusIdChange={setLeadFilterStatusId}
            leadTagId={leadFilterLeadTagId}
            onLeadTagIdChange={setLeadFilterLeadTagId}
            leadTagOptions={departmentLeadTags.map((t) => ({ id: t._id, name: t.name, color: t.color || '#9ca3af' }))}
            assignedTo={leadFilterAssignedTo}
            onAssignedToChange={setLeadFilterAssignedTo}
            dateFrom={leadFilterDateFrom}
            onDateFromChange={setLeadFilterDateFrom}
            dateTo={leadFilterDateTo}
            onDateToChange={setLeadFilterDateTo}
            sortBy={leadSortBy}
            onSortByChange={setLeadSortBy}
            sortOrder={leadSortOrder}
            onSortOrderChange={setLeadSortOrder}
            statuses={statuses}
            assigneeOptions={assigneeOptions}
            onReset={resetLeadFilters}
          />

          <LeadsBulkBar
            show={canBulkEditLeads || canBulkDeleteLeads}
            someSelected={someSelected}
            selectedCount={selectedLeadIds.length}
            total={leadTotal}
            selectingAllIds={selectingAllIds}
            canBulkEdit={canBulkEditLeads}
            canBulkDelete={canBulkDeleteLeads}
            onSelectAll={selectAllMatchingFilters}
            onBulkEdit={() => setBulkEditOpen(true)}
            onBulkDelete={() => setBulkDeleteOpen(true)}
            onClearSelection={() => setSelectedLeadIds([])}
          />

          <LeadsTable
            leads={leads}
            loading={leadLoading}
            total={leadTotal}
            page={leadPage}
            rowsPerPage={leadRowsPerPage}
            onPageChange={handleLeadPageChange}
            onRowsPerPageChange={handleLeadRowsPerPageChange}
            statuses={statuses}
            leadTagMap={leadTagMap}
            leadTagOptions={departmentLeadTags.map((t) => ({ id: t._id, name: t.name, color: t.color || '#9ca3af' }))}
            onLeadTagChange={handleLeadTagChange}
            assigneeOptions={assigneeOptions}
            assigneeNameMap={assigneeNameMap}
            canBulkEdit={canBulkEditLeads}
            canCreateLead={!!canCreateLead}
            isEmployee={isEmployee}
            currentUserId={user?.userId}
            selectedLeadIds={selectedLeadIds}
            allSelectedOnPage={allSelectedOnPage}
            someSelected={someSelected}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelectLead={toggleSelectLead}
            sortBy={leadSortBy}
            sortOrder={leadSortOrder}
            onSortUpdatedAt={() => {
              if (leadSortBy === 'updatedAt') setLeadSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))
              else { setLeadSortBy('updatedAt'); setLeadSortOrder('desc') }
              setLeadPage(0)
            }}
            onStatusChange={handleLeadStatusChange}
            onAssignedToChange={handleLeadAssignedToChange}
            onEditLead={openLeadEdit}
            onDeleteLead={setLeadDeleteId}
            updatingLeadId={updatingLeadId}
            onLeadClick={(id) => navigate(`/leads/${id}${selectedDepartmentId ? `?departmentId=${selectedDepartmentId}` : ''}`)}
            onCommentClick={canCreateLead ? openCommentPopup : undefined}
            onCopyPhone={() => toast.success('Телефон скопирован')}
            onCopyEmail={() => toast.success('Email скопирован')}
          />
        </>
      )}

      <LeadFormDialog
        open={leadFormOpen}
        onClose={() => !leadSaving && setLeadFormOpen(false)}
        onSubmit={handleLeadSubmit}
        saving={leadSaving}
        isEdit={!!leadEditId}
        name={leadName}
        onNameChange={setLeadName}
        lastName={leadLastName}
        onLastNameChange={setLeadLastName}
        phone={leadPhone}
        onPhoneChange={setLeadPhone}
        phone2={leadPhone2}
        onPhone2Change={setLeadPhone2}
        email={leadEmail}
        onEmailChange={setLeadEmail}
        email2={leadEmail2}
        onEmail2Change={setLeadEmail2}
        statusId={leadStatusId}
        onStatusIdChange={setLeadStatusId}
        leadTagId={leadTagId}
        onLeadTagIdChange={setLeadTagId}
        leadTagOptions={departmentLeadTags.map((t) => ({ id: t._id, name: t.name, color: t.color || '#9ca3af' }))}
        assignedTo={leadAssignedTo}
        onAssignedToChange={setLeadAssignedTo}
        statuses={statuses}
        assigneeOptions={assigneeOptions}
        assigneeNameMap={assigneeNameMap}
        isEmployee={isEmployee}
        phoneDisabled={Boolean(leadEditId && isEmployee && editingLead?.phone?.trim())}
        phone2Disabled={Boolean(leadEditId && isEmployee && editingLead?.phone2?.trim())}
        phoneHelperText={leadEditId && isEmployee && editingLead?.phone?.trim() ? 'Только руководитель может изменить' : leadEditId && isEmployee ? 'Можно добавить, если пусто' : undefined}
        phone2HelperText={leadEditId && isEmployee && editingLead?.phone2?.trim() ? 'Только руководитель может изменить' : leadEditId && isEmployee ? 'Можно добавить, если пусто' : undefined}
      />

      <LeadDeleteDialog
        open={!!leadDeleteId}
        onClose={() => !leadDeleting && setLeadDeleteId(null)}
        onConfirm={handleLeadDelete}
        deleting={leadDeleting}
      />

      <LeadCommentPopup
        open={!!commentPopupLead}
        onClose={() => !commentPopupSaving && setCommentPopupLead(null)}
        leadName={commentPopupLead ? [commentPopupLead.name, commentPopupLead.lastName].filter(Boolean).join(' ').trim() || undefined : undefined}
        comment={commentPopupValue}
        onCommentChange={setCommentPopupValue}
        onSave={handleCommentPopupSave}
        saving={commentPopupSaving}
      />

      <BulkEditDialog
        open={bulkEditOpen}
        onClose={() => !bulkEditSaving && setBulkEditOpen(false)}
        onApply={handleBulkEditApply}
        saving={bulkEditSaving}
        selectedCount={selectedLeadIds.length}
        statusId={bulkEditStatusId}
        onStatusIdChange={setBulkEditStatusId}
        leadTagId={bulkEditLeadTagId}
        onLeadTagIdChange={setBulkEditLeadTagId}
        leadTagOptions={departmentLeadTags.map((t) => ({ id: t._id, name: t.name, color: t.color || '#9ca3af' }))}
        changeAssignees={bulkEditChangeAssignees}
        onChangeAssigneesChange={setBulkEditChangeAssignees}
        assignedTo={bulkEditAssignedToSafe}
        onAssignedToChange={setBulkEditAssignedTo}
        statuses={statuses}
        assigneeOptions={assigneeOptions}
        assigneeNameMap={assigneeNameMap}
      />

      <BulkDeleteDialog
        open={bulkDeleteOpen}
        onClose={() => !bulkDeleteSaving && setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        count={selectedLeadIds.length}
        saving={bulkDeleteSaving}
      />

      <BulkImportDialog
        open={bulkDialogOpen}
        onClose={() => !bulkSubmitting && setBulkDialogOpen(false)}
        onSubmit={handleBulkSubmit}
        submitting={bulkSubmitting}
        parsedCount={bulkParsedItems?.length ?? null}
        result={bulkResult}
        fileInputRef={bulkFileInputRef}
        onFileChange={handleBulkFileChange}
      />
    </Box>
  )
}

export default LeadsPage
