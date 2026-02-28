import React from 'react'
import { Box, Typography, Paper, TextField, Button, IconButton, CircularProgress } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { formatDateTime } from '../constants'
import { cardPaperSx } from '../constants'
import type { LeadNoteItem } from '@/api/leads'

export interface NotesSectionProps {
  notes: LeadNoteItem[]
  loading: boolean
  content: string
  onContentChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  assigneeNameMap: Record<string, string>
  canEditOrDelete: (note: LeadNoteItem) => boolean
  onEdit: (note: LeadNoteItem) => void
  onDelete: (noteId: string) => void
}

const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  loading,
  content,
  onContentChange,
  onSubmit,
  submitting,
  assigneeNameMap,
  canEditOrDelete,
  onEdit,
  onDelete,
}) => (
  <Paper sx={cardPaperSx}>
    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.95)', mb: 2, fontFamily: '"Orbitron", sans-serif', flexShrink: 0 }}>
      Заметки
    </Typography>
    <Box component="form" onSubmit={onSubmit} sx={{ mb: 2, flexShrink: 0 }}>
      <TextField
        fullWidth
        multiline
        minRows={2}
        placeholder="Добавить заметку..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        disabled={submitting}
        sx={{ ...formFieldSx, '& .MuiOutlinedInput-root': { minHeight: 72 } }}
      />
      <Button
        type="submit"
        size="small"
        startIcon={<NoteAddIcon />}
        disabled={submitting || !content.trim()}
        sx={{ mt: 1, color: 'rgba(167,139,250,0.95)' }}
      >
        {submitting ? 'Добавление…' : 'Добавить заметку'}
      </Button>
    </Box>
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {loading ? (
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : notes.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет заметок</Typography>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            pr: 0.5,
            ...(notes.length > 4 && { maxHeight: 320 }),
          }}
        >
          {notes.map((note) => (
            <Box
              key={note._id}
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                  >
                    {note.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5, display: 'block' }}>
                    {assigneeNameMap[note.authorId] || note.authorId} · {formatDateTime(note.createdAt)}
                  </Typography>
                </Box>
                {canEditOrDelete(note) && (
                  <Box sx={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => onEdit(note)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(note._id)} sx={{ color: 'rgba(248,113,113,0.9)' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  </Paper>
)

export default NotesSection
