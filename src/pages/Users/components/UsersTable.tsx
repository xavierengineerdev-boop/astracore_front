import React from 'react'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import DeleteIcon from '@mui/icons-material/Delete'
import { ROLE_LABELS } from '@/constants/roles'
import { formatDate } from '../constants'
import type { UserItem } from '@/api/users'
import type { DepartmentItem } from '@/api/departments'

const cellSx = { borderColor: 'rgba(255,255,255,0.08)' }
const headerSx = { color: 'rgba(255,255,255,0.6)', ...cellSx }

export interface UsersTableProps {
  list: UserItem[]
  departments: DepartmentItem[]
  canEditUser: (u: UserItem) => boolean
  canDeleteUser: (u: UserItem) => boolean
  canRemoveFromDept: (u: UserItem) => boolean
  onRowClick: (u: UserItem) => void
  onEdit: (u: UserItem) => void
  onRemoveFromDept: (u: UserItem) => void
  onDelete: (e: React.MouseEvent, u: UserItem) => void
}

const UsersTable: React.FC<UsersTableProps> = ({
  list,
  departments,
  canEditUser,
  canDeleteUser,
  canRemoveFromDept,
  onRowClick,
  onEdit,
  onRemoveFromDept,
  onDelete,
}) => (
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
          <TableCell sx={headerSx}>Имя</TableCell>
          <TableCell sx={headerSx}>Email</TableCell>
          <TableCell sx={headerSx}>Роль</TableCell>
          <TableCell sx={headerSx}>Статус</TableCell>
          <TableCell sx={headerSx}>Отдел</TableCell>
          <TableCell sx={headerSx}>Дата создания</TableCell>
          <TableCell sx={headerSx}>Последний вход</TableCell>
          <TableCell sx={{ ...headerSx, width: 100 }}>Действия</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} sx={{ color: 'rgba(255,255,255,0.5)', ...cellSx, py: 3, textAlign: 'center' }}>
              Нет пользователей
            </TableCell>
          </TableRow>
        ) : (
          list.map((u) => (
            <TableRow
              key={u._id}
              hover
              onClick={() => onRowClick(u)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
            >
              <TableCell sx={{ color: 'rgba(255,255,255,0.9)', ...cellSx }}>
                {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
              </TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.9)', ...cellSx }}>{u.email}</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', ...cellSx }}>
                {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
              </TableCell>
              <TableCell sx={{ color: u.isActive !== false ? 'rgba(167,139,250,0.9)' : 'rgba(248,113,113,0.9)', ...cellSx }}>
                {u.isActive !== false ? 'Активен' : 'Отключён'}
              </TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', ...cellSx }}>
                {u.departmentId ? (departments.find((d) => String(d._id) === String(u.departmentId))?.name ?? '—') : '—'}
              </TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', ...cellSx }}>{formatDate(u.createdAt)}</TableCell>
              <TableCell sx={{ color: 'rgba(255,255,255,0.6)', ...cellSx }}>
                {u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}
              </TableCell>
              <TableCell sx={cellSx} onClick={(e) => e.stopPropagation()}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {canEditUser(u) && (
                    <Tooltip title="Редактировать">
                      <IconButton size="small" onClick={() => onEdit(u)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canRemoveFromDept(u) && (
                    <Tooltip title="Удалить из отдела">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRemoveFromDept(u) }} sx={{ color: 'rgba(251,191,36,0.9)' }}>
                        <PersonRemoveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDeleteUser(u) && (
                    <Tooltip title="Удалить">
                      <IconButton size="small" onClick={(e) => onDelete(e, u)} sx={{ color: 'rgba(248,113,113,0.9)' }}>
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
)

export default UsersTable
