import type { SxProps, Theme } from '@mui/material'

/**
 * Общие стили полей форм (тёмная тема): цвет текста и лейблов.
 * Использовать в TextField, Select, DatePicker и т.д. на страницах с тёмным фоном.
 */
export const formFieldSx: SxProps<Theme> = {
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.95)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
}

/**
 * Расширенные стили для полей с minHeight (формы создания/редактирования).
 */
export const formFieldSxTall: SxProps<Theme> = {
  ...formFieldSx,
  '& .MuiOutlinedInput-root': { minHeight: 48 },
  '& .MuiOutlinedInput-input': {
    paddingTop: '16px',
    paddingBottom: '16px',
    boxSizing: 'border-box',
  },
}

/**
 * Стили для Paper в диалогах (тёмный фон, граница).
 * Использовать: <Dialog PaperProps={{ sx: dialogPaperSx }} />
 */
export const dialogPaperSx: SxProps<Theme> = {
  bgcolor: 'rgba(18, 22, 36, 0.98)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2,
}

/**
 * Стили для заголовка диалога.
 */
export const dialogTitleSx: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.95)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  pb: 2,
}

/**
 * Цвет текста в ячейках таблиц (основной).
 */
export const tableCellSx: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.9)',
}

/**
 * Цвет текста в ячейках таблиц (второстепенный).
 */
export const tableCellSecondarySx: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.8)',
}

/**
 * Цвет заголовков колонок таблицы.
 */
export const tableHeadCellSx: SxProps<Theme> = {
  color: 'rgba(255,255,255,0.7)',
  fontWeight: 600,
}
