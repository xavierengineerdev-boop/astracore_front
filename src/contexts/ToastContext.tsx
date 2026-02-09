import React, { createContext, useContext, useState, useCallback } from 'react'
import { Snackbar, Alert, type AlertColor } from '@mui/material'

export interface ToastOptions {
  severity?: AlertColor
  autoHideDuration?: number
}

interface ToastState {
  open: boolean
  message: string
  severity: AlertColor
  autoHideDuration: number
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const DEFAULT_DURATION = 5000

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: DEFAULT_DURATION,
  })

  const show = useCallback((message: string, options?: ToastOptions) => {
    setState({
      open: true,
      message,
      severity: options?.severity ?? 'info',
      autoHideDuration: options?.autoHideDuration ?? DEFAULT_DURATION,
    })
  }, [])

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const value: ToastContextValue = {
    toast: show,
    success: (msg) => show(msg, { severity: 'success' }),
    error: (msg) => show(msg, { severity: 'error' }),
    info: (msg) => show(msg, { severity: 'info' }),
    warning: (msg) => show(msg, { severity: 'warning' }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={state.autoHideDuration}
        onClose={hide}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 } }}
      >
        <Alert
          onClose={hide}
          severity={state.severity}
          variant="filled"
          sx={{
            width: '100%',
            boxShadow: 2,
            '&.MuiAlert-filledSuccess': { bgcolor: 'rgba(34, 197, 94, 0.95)' },
            '&.MuiAlert-filledError': { bgcolor: 'rgba(239, 68, 68, 0.95)' },
            '&.MuiAlert-filledInfo': { bgcolor: 'rgba(59, 130, 246, 0.95)' },
            '&.MuiAlert-filledWarning': { bgcolor: 'rgba(234, 179, 8, 0.95)' },
          }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
