import React from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material'
import UploadIcon from '@mui/icons-material/Upload'
import { dialogPaperSx, dialogTitleSx } from '@/theme/formStyles'

export interface BulkImportDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  submitting: boolean
  parsedCount: number | null
  result: { added: number; duplicates: number } | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onClose,
  onSubmit,
  submitting,
  parsedCount,
  result,
  fileInputRef,
  onFileChange,
}) => (
  <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
    <DialogTitle sx={dialogTitleSx}>Массовое добавление лидов</DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
        Загрузите файл (Excel .xlsx, CSV, TXT): 1-й столбец — имя, 2-й — телефон, 3-й — почта (необязательно). Дубликаты по телефону в отделе не добавляются.
      </Typography>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.txt,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <Button
        size="small"
        startIcon={<UploadIcon />}
        onClick={() => fileInputRef.current?.click()}
        disabled={submitting}
        sx={{ mb: 2, color: 'rgba(167,139,250,0.9)' }}
      >
        Загрузить из файла
      </Button>
      {parsedCount !== null && parsedCount > 0 && (
        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Загружено строк: {parsedCount}
        </Typography>
      )}
      {result !== null && (
        <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.9)' }}>
          Добавлено: <strong>{result.added}</strong>. Дубликатов (не добавлено): <strong>{result.duplicates}</strong>.
        </Typography>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={submitting} sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Закрыть
      </Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={submitting || !parsedCount}
        sx={{ bgcolor: 'rgba(124, 58, 237, 0.9)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' } }}
      >
        {submitting ? 'Импорт…' : 'Импортировать'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default BulkImportDialog
