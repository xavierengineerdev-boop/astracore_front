import React from 'react'
import { LinearProgress } from '@mui/material'
import { useAuth } from '@/auth/AuthProvider'

const GlobalLoader: React.FC = () => {
  const { loading } = useAuth()
  if (!loading) return null
  return (
    <LinearProgress
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: 3,
        '& .MuiLinearProgress-bar': {
          bgcolor: 'rgba(167, 139, 250, 0.9)',
        },
        backgroundColor: 'rgba(167, 139, 250, 0.2)',
      }}
    />
  )
}

export default GlobalLoader
