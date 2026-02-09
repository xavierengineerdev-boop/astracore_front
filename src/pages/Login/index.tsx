import React from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { keyframes } from '@emotion/react'
import { Box, Paper, Typography } from '@mui/material'
import LoginForm from '@/components/LoginForm'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'

const starfieldDown = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(-220px); }
`

const starfieldUp = keyframes`
  from { transform: translateY(-220px); }
  to { transform: translateY(0); }
`

const nebulaPulse = keyframes`
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
`

const twinkle = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.95; }
`

const pageBackground = {
  position: 'fixed' as const,
  inset: 0,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  background: 'linear-gradient(180deg, #0f1219 0%, #131825 50%, #0d1018 100%)',
}

const nebulaLayer = {
  position: 'absolute' as const,
  inset: 0,
  background: [
    'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(100, 60, 180, 0.4) 0%, transparent 50%)',
    'radial-gradient(ellipse 80% 50% at 80% 50%, rgba(46, 196, 182, 0.15) 0%, transparent 45%)',
    'radial-gradient(ellipse 60% 80% at 20% 80%, rgba(107, 75, 246, 0.2) 0%, transparent 45%)',
  ].join(', '),
  animation: `${nebulaPulse} 6s ease-in-out infinite`,
  pointerEvents: 'none' as const,
}

const starfieldLayer = {
  position: 'absolute' as const,
  inset: 0,
  backgroundImage: [
    'radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.6), transparent)',
    'radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.4), transparent)',
    'radial-gradient(2px 2px at 50px 160px, rgba(255,255,255,0.5), transparent)',
    'radial-gradient(2px 2px at 90px 40px, rgba(255,255,255,0.35), transparent)',
    'radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.45), transparent)',
    'radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.3), transparent)',
    'radial-gradient(2px 2px at 200px 50px, rgba(255,255,255,0.5), transparent)',
    'radial-gradient(2px 2px at 250px 180px, rgba(255,255,255,0.4), transparent)',
    'radial-gradient(2px 2px at 300px 90px, rgba(255,255,255,0.35), transparent)',
    'radial-gradient(2px 2px at 350px 140px, rgba(255,255,255,0.45), transparent)',
  ].join(', '),
  backgroundRepeat: 'repeat',
  backgroundSize: '380px 220px',
  animation: `${starfieldDown} 90s linear infinite`,
  pointerEvents: 'none' as const,
  opacity: 0.9,
}

const starfieldLayer2 = {
  position: 'absolute' as const,
  inset: 0,
  backgroundImage: [
    'radial-gradient(1.5px 1.5px at 60px 20px, rgba(255,255,255,0.5), transparent)',
    'radial-gradient(1.5px 1.5px at 120px 100px, rgba(255,255,255,0.35), transparent)',
    'radial-gradient(1.5px 1.5px at 180px 60px, rgba(255,255,255,0.4), transparent)',
    'radial-gradient(1.5px 1.5px at 240px 150px, rgba(255,255,255,0.45), transparent)',
    'radial-gradient(1.5px 1.5px at 320px 40px, rgba(255,255,255,0.3), transparent)',
  ].join(', '),
  backgroundRepeat: 'repeat',
  backgroundSize: '400px 200px',
  animation: `${starfieldUp} 120s linear infinite`,
  pointerEvents: 'none' as const,
  opacity: 0.6,
}

const twinkleLayer = {
  position: 'absolute' as const,
  inset: 0,
  backgroundImage: [
    'radial-gradient(3px 3px at 100px 80px, rgba(255,255,255,0.9), transparent)',
    'radial-gradient(3px 3px at 280px 140px, rgba(255,255,255,0.85), transparent)',
    'radial-gradient(3px 3px at 180px 40px, rgba(255,255,255,0.8), transparent)',
  ].join(', '),
  backgroundRepeat: 'no-repeat',
  animation: `${twinkle} 3s ease-in-out infinite`,
  pointerEvents: 'none' as const,
}

const twinkleLayerDelayed = {
  ...twinkleLayer,
  backgroundImage: [
    'radial-gradient(2.5px 2.5px at 50px 160px, rgba(255,255,255,0.85), transparent)',
    'radial-gradient(2.5px 2.5px at 320px 60px, rgba(255,255,255,0.8), transparent)',
  ].join(', '),
  animationDelay: '1.5s',
}

const loginCardSx = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 400,
  m: 2,
  p: { xs: 3, sm: 4 },
  borderRadius: 2,
  bgcolor: 'rgba(18, 22, 36, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const toast = useToast()
  const [error, setError] = React.useState<string | null>(null)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (values: { email: string; password: string }) => {
    setError(null)
    try {
      await login(values.email, values.password)
      toast.success('Вход выполнен')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка входа'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <Box sx={pageBackground}>
      <Box sx={nebulaLayer} />
      <Box sx={starfieldLayer} />
      <Box sx={starfieldLayer2} />
      <Box sx={twinkleLayer} />
      <Box sx={twinkleLayerDelayed} />
      <Paper elevation={0} sx={loginCardSx}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 600,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.95)',
            mb: 0.5,
          }}
        >
          AstraCore
        </Typography>
        <Typography
          variant="body2"
          component="div"
          sx={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.45)',
            mb: 3,
          }}
        >
          Вход в систему
        </Typography>
        <LoginForm onLogin={handleSubmit} error={error} onDismissError={() => setError(null)} />
      </Paper>
    </Box>
  )
}

export default LoginPage
