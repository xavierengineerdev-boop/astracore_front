import { Box, Button, TextField, Stack, Alert } from '@mui/material'
import { useState } from 'react'

const inputSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 52,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(167, 139, 250, 0.8)',
      borderWidth: 1,
    },
    '& .MuiOutlinedInput-input': {
      paddingTop: '18px',
      paddingBottom: '18px',
      fontSize: '1.05rem',
      boxSizing: 'border-box',
    },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)', fontSize: '1rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(196, 181, 253, 0.95)' },
  '& .MuiInputBase-input': { color: 'rgba(255, 255, 255, 0.95)' },
}

const buttonSx = {
  borderRadius: 2,
  py: 2,
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1.1rem',
  bgcolor: 'rgba(124, 58, 237, 0.9)',
  '&:hover': { bgcolor: 'rgba(124, 58, 237, 1)' },
}

interface LoginFormProps {
  onLogin?: (data: { email: string; password: string }) => void
  error?: string | null
  onDismissError?: () => void
}

export default function LoginForm({ onLogin, error, onDismissError }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onLogin) return
    setLoading(true)
    onDismissError?.()
    try {
      await onLogin({ email, password })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={submit}>
      <Stack spacing={2.5}>
        {error && (
          <Alert severity="error" onClose={onDismissError} sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
            {error}
          </Alert>
        )}
        <TextField
          sx={inputSx}
          autoFocus
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          variant="outlined"
          type="email"
          autoComplete="email"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          sx={inputSx}
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          fullWidth
          required
          variant="outlined"
          autoComplete="current-password"
          InputLabelProps={{ shrink: true }}
        />
        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={buttonSx}>
          {loading ? 'Вход…' : 'Войти'}
        </Button>
      </Stack>
    </Box>
  )
}
