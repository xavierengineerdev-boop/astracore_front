import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '@/auth/AuthProvider'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

interface Props {
  children: React.ReactElement
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation()
  const { user, loading } = useAuth()
  const hasTokens = typeof window !== 'undefined' &&
    (!!localStorage.getItem(ACCESS_KEY) || !!localStorage.getItem(REFRESH_KEY))

  if (!loading && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (loading && hasTokens) {
    return (
      <>
        {children}
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(10, 14, 26, 0.85)',
            zIndex: 9999,
          }}
        >
          <CircularProgress sx={{ color: 'rgba(167,139,250,0.8)' }} />
        </Box>
      </>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export default ProtectedRoute
