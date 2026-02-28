import React from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'

export interface LeadsBulkBarProps {
  show: boolean
  someSelected: boolean
  selectedCount: number
  total: number
  selectingAllIds: boolean
  canBulkEdit: boolean
  canBulkDelete: boolean
  onSelectAll: () => void
  onBulkEdit: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
}

const LeadsBulkBar: React.FC<LeadsBulkBarProps> = ({
  show,
  someSelected,
  selectedCount,
  total,
  selectingAllIds,
  canBulkEdit,
  canBulkDelete,
  onSelectAll,
  onBulkEdit,
  onBulkDelete,
  onClearSelection,
}) => {
  if (!show) return null

  return (
    <Paper sx={{ p: 1.5, mb: 1, bgcolor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 2, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {someSelected && (
          <>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>Выбрано: {selectedCount}</Typography>
            {canBulkEdit && (
              <Button size="small" variant="outlined" onClick={onBulkEdit} sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.5)' }}>
                Изменить статус / исполнителей
              </Button>
            )}
            {canBulkDelete && (
              <Button size="small" variant="outlined" color="error" onClick={onBulkDelete}>
                Удалить выбранные
              </Button>
            )}
            <Button size="small" onClick={onClearSelection} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Снять выделение
            </Button>
          </>
        )}
        {total > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={onSelectAll}
            disabled={selectingAllIds}
            sx={{ color: 'rgba(167,139,250,0.95)', borderColor: 'rgba(167,139,250,0.5)' }}
          >
            {selectingAllIds ? 'Загрузка…' : `Выбрать все (${total})`}
          </Button>
        )}
      </Box>
    </Paper>
  )
}

export default LeadsBulkBar
