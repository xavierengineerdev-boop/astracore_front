import React from 'react'
import { Box, Typography, Paper, TextField, Button, IconButton, CircularProgress } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { formFieldSxTall as formFieldSx } from '@/theme/formStyles'
import { formatDateTime } from '../constants'
import { cardPaperSx } from '../constants'
import type { LeadCommentItem } from '@/api/leads'

export interface CommentsSectionProps {
  comments: LeadCommentItem[]
  loading: boolean
  content: string
  onContentChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  assigneeNameMap: Record<string, string>
  canEditOrDelete: (comment: LeadCommentItem) => boolean
  onEdit: (comment: LeadCommentItem) => void
  onDelete: (commentId: string) => void
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
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
      Комментарии
    </Typography>
    <Box component="form" onSubmit={onSubmit} sx={{ mb: 2, flexShrink: 0 }}>
      <TextField
        fullWidth
        multiline
        minRows={2}
        placeholder="Добавить комментарий..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        disabled={submitting}
        sx={{ ...formFieldSx, '& .MuiOutlinedInput-root': { minHeight: 72 } }}
      />
      <Button
        type="submit"
        size="small"
        startIcon={<ChatBubbleOutlineIcon />}
        disabled={submitting || !content.trim()}
        sx={{ mt: 1, color: 'rgba(167,139,250,0.95)' }}
      >
        {submitting ? 'Добавление…' : 'Добавить комментарий'}
      </Button>
    </Box>
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {loading ? (
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Нет комментариев</Typography>
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
            ...(comments.length > 4 && { maxHeight: 320 }),
          }}
        >
          {comments.map((comment) => (
            <Box
              key={comment._id}
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
                    {comment.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5, display: 'block' }}>
                    {assigneeNameMap[comment.authorId] || comment.authorId} · {formatDateTime(comment.createdAt)}
                  </Typography>
                </Box>
                {canEditOrDelete(comment) && (
                  <Box sx={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => onEdit(comment)} sx={{ color: 'rgba(167,139,250,0.9)' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(comment._id)} sx={{ color: 'rgba(248,113,113,0.9)' }}>
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

export default CommentsSection
