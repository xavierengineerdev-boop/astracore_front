import React from 'react'
import { Box, Tooltip } from '@mui/material'

export interface CopyableTextProps {
  /** Текст для отображения и копирования. Если пусто, показывается placeholder. */
  value: string
  /** Что показать, когда value пустой (по умолчанию "—") */
  placeholder?: string
  /** Вызывается после успешного копирования (например, toast.success) */
  onCopy?: () => void
  /** Дополнительные sx для контейнера */
  sx?: React.ComponentProps<typeof Box>['sx']
}

/**
 * Текст, который по клику копируется в буфер обмена.
 * Переиспользуется в таблицах лидов (телефон, email) и везде, где нужен "клик — скопировано".
 */
const CopyableText: React.FC<CopyableTextProps> = ({
  value,
  placeholder = '—',
  onCopy,
  sx,
}) => {
  const trimmed = (value ?? '').trim()
  const display = trimmed || placeholder
  const canCopy = Boolean(trimmed)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canCopy) return
    navigator.clipboard.writeText(trimmed)
    onCopy?.()
  }

  return (
    <Tooltip title={canCopy ? 'Нажмите, чтобы скопировать' : ''}>
      <Box
        component="span"
        sx={{
          ...(canCopy && { cursor: 'pointer', '&:hover': { color: 'rgba(167,139,250,0.9)' } }),
          ...sx,
        }}
        onClick={handleClick}
      >
        {display}
      </Box>
    </Tooltip>
  )
}

export default CopyableText
