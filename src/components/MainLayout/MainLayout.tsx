import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Avatar,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import BarChartIcon from '@mui/icons-material/BarChart'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import PersonIcon from '@mui/icons-material/Person'
import { useAuth } from '@/auth/AuthProvider'
import { useToast } from '@/contexts/ToastContext'
import { getUpcomingReminders, markLeadReminderDone, type UpcomingReminderItem } from '@/api/leads'

const REMINDER_POLL_MS = 20_000
const ONE_MINUTE_MS = 60_000
const RING_DURATION_MS = 5_000
const REMINDER_BELL_SRC = `${(typeof import.meta.env.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/').replace(/\/$/, '')}/reminder-bell.wav`

function playReminderRing(): void {
  const audio = new Audio(REMINDER_BELL_SRC)
  audio.volume = 0.7
  let stopAt = Date.now() + RING_DURATION_MS
  const play = () => {
    if (Date.now() >= stopAt) return
    audio.currentTime = 0
    audio.play().catch(() => {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const gain = ctx.createGain()
        gain.gain.value = 0.2
        gain.connect(ctx.destination)
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = 880
        osc.connect(gain)
        osc.start(0)
        osc.stop(2.5)
        const osc2 = ctx.createOscillator()
        osc2.type = 'sine'
        osc2.frequency.value = 1100
        osc2.connect(gain)
        osc2.start(2.5)
        osc2.stop(5)
        setTimeout(() => ctx.close(), 6000)
      } catch {
        // ignore
      }
    })
  }
  play()
  audio.addEventListener('ended', () => {
    if (Date.now() < stopAt) play()
  })
  setTimeout(() => {
    audio.pause()
    audio.remove()
  }, RING_DURATION_MS + 500)
}

const DRAWER_WIDTH = 240
const HEADER_HEIGHT = 64
const SIDEBAR_STORAGE_KEY = 'astracore_sidebar_open'

const getStoredSidebarOpen = (): boolean => {
  try {
    const v = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return v !== 'false'
  } catch {
    return true
  }
}

const MainLayout: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const toast = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarOpen)
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminderItem[]>([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const rangForIdsRef = useRef<Set<string>>(new Set())
  const upcomingRef = useRef(upcomingReminders)
  upcomingRef.current = upcomingReminders
  const audioUnlockedRef = useRef(false)

  const notifCount = upcomingReminders.length

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return
    audioUnlockedRef.current = true
    const a = new Audio(REMINDER_BELL_SRC)
    a.volume = 0
    a.play().then(() => a.pause()).catch(() => { audioUnlockedRef.current = false })
  }

  useEffect(() => {
    if (!user) return
    const tick = () => {
      getUpcomingReminders()
        .then(setUpcomingReminders)
        .catch(() => {})
    }
    tick()
    const id = setInterval(tick, REMINDER_POLL_MS)
    return () => clearInterval(id)
  }, [user?.userId])

  useEffect(() => {
    if (!user) return
    const checkDueSoon = () => {
      const now = Date.now()
      for (const r of upcomingRef.current) {
        const at = new Date(r.remindAt).getTime()
        const oneMinBefore = at - ONE_MINUTE_MS
        if (now >= oneMinBefore && now <= at && !rangForIdsRef.current.has(r._id)) {
          rangForIdsRef.current.add(r._id)
          playReminderRing()
        }
      }
    }
    checkDueSoon()
    const id = setInterval(checkDueSoon, 10_000)
    return () => clearInterval(id)
  }, [user?.userId])

  useEffect(() => {
    if (!notifAnchor || !user) return
    setLoadingReminders(true)
    getUpcomingReminders()
      .then(setUpcomingReminders)
      .catch(() => setUpcomingReminders([]))
      .finally(() => setLoadingReminders(false))
  }, [notifAnchor, user?.userId])

  const handleDrawerToggle = () => setMobileOpen((v) => !v)
  const handleSidebarToggle = () => {
    setSidebarOpen((v) => {
      const next = !v
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }
  const handleLogout = () => {
    setProfileAnchor(null)
    toast.info('Вы вышли из аккаунта')
    logout()
  }

  const menuItems = [
    { path: '/', label: 'Главная', icon: <DashboardIcon /> },
    ...(user?.role === 'super' || user?.role === 'admin'
      ? [{ path: '/users', label: 'Пользователи', icon: <PeopleIcon /> }]
      : []),
    ...(user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager'
      ? [{ path: '/departments', label: 'Отделы', icon: <BusinessIcon /> }]
      : []),
    ...(user?.role === 'employee' && user?.departmentId
      ? [{ path: `/departments/${user.departmentId}`, label: 'Мой отдел', icon: <BusinessIcon /> }]
      : []),
    ...(user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager' || (user?.role === 'employee' && user?.departmentId)
      ? [{ path: '/leads', label: 'Лиды', icon: <ContactPageIcon /> }]
      : []),
    ...(user?.role === 'super' || user?.role === 'admin' || user?.role === 'manager'
      ? [{ path: '/statistics', label: 'Статистика', icon: <BarChartIcon /> }]
      : []),
  ]

  const drawerContent = (collapsed: boolean) => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'rgba(15, 18, 32, 0.98)',
        overflow: 'hidden',
      }}
    >
      <List sx={{ pt: 2, px: collapsed ? 1 : 1.5 }}>
        {menuItems.map(({ path, label, icon }) => (
          <ListItemButton
            key={path}
            selected={location.pathname === path || (path !== '/' && location.pathname.startsWith(path))}
            onClick={() => { navigate(path); setMobileOpen(false) }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: 'rgba(255,255,255,0.7)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
              '&.Mui-selected': {
                bgcolor: 'rgba(167, 139, 250, 0.15)',
                color: 'rgba(196, 181, 253, 0.95)',
              },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 40 }}>{icon}</ListItemIcon>
            {!collapsed && <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.95rem' }} />}
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: '#0a0e1a' }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          bgcolor: 'rgba(15, 18, 32, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => (isMobile ? handleDrawerToggle() : handleSidebarToggle())}
            sx={{ mr: 1.5 }}
            aria-label={isMobile ? 'Меню' : sidebarOpen ? 'Свернуть меню' : 'Развернуть меню'}
          >
            {isMobile ? <MenuIcon /> : sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 700,
              letterSpacing: '0.12em',
              background: 'linear-gradient(135deg, #e8e0ff 0%, #a78bfa 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AstraCore
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            color="inherit"
            onClick={(e) => {
              unlockAudio()
              setNotifAnchor(e.currentTarget)
            }}
            aria-label="Уведомления"
            size="small"
          >
            <Badge badgeContent={notifCount} color="secondary">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            aria-label="Профиль"
            size="small"
            sx={{ ml: 0.5 }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'rgba(167, 139, 250, 0.8)',
                fontSize: '0.9rem',
              }}
            >
              {user?.email?.slice(0, 1).toUpperCase() ?? '?'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 320,
                maxHeight: 400,
                bgcolor: 'rgba(18, 22, 36, 0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                Напоминания
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
              {loadingReminders ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.5)">Загрузка…</Typography>
                </Box>
              ) : upcomingReminders.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.5)">Нет напоминаний на ближайшие 24 ч</Typography>
                </Box>
              ) : (
                upcomingReminders.map((r) => (
                  <MenuItem
                    key={r._id}
                    onClick={async () => {
                      setNotifAnchor(null)
                      try {
                        await markLeadReminderDone(r.leadId, r._id)
                        getUpcomingReminders().then(setUpcomingReminders).catch(() => {})
                      } catch {
                        // keep in list on error
                      }
                      navigate(`/leads/${r.leadId}`)
                    }}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 0.25,
                      py: 1.5,
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.title}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      {r.leadName ?? 'Лид'} · {new Date(r.remindAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Box>
          </Menu>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                bgcolor: 'rgba(18, 22, 36, 0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }} noWrap>
                {user?.email}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)" display="block">
                {user?.role}
              </Typography>
              {user?.lastLoginAt ? (
                <Typography variant="caption" color="rgba(255,255,255,0.45)" display="block" sx={{ mt: 0.5 }}>
                  Последний вход: {new Date(user.lastLoginAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              ) : null}
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <MenuItem
              onClick={() => { setProfileAnchor(null); if (user?.userId) navigate(`/users/${user.userId}`); }}
              sx={{ color: 'rgba(255,255,255,0.8)', gap: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <PersonIcon fontSize="small" sx={{ color: 'rgba(167,139,250,0.9)' }} />
              </ListItemIcon>
              Профиль
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'rgba(248,113,113,0.9)', gap: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 0 }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          mt: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          overflow: 'hidden',
        }}
      >
        {/* Mobile: overlay drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              top: HEADER_HEIGHT,
              height: `calc(100% - ${HEADER_HEIGHT}px)`,
              borderRight: '1px solid rgba(255,255,255,0.06)',
              bgcolor: 'rgba(15, 18, 32, 0.98)',
            },
          }}
        >
          {drawerContent(false)}
        </Drawer>

        {/* Desktop: sidebar under header, collapsible */}
        <Box
          component="nav"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: sidebarOpen ? DRAWER_WIDTH : 56,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {drawerContent(!sidebarOpen)}
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            minHeight: 0,
            p: 3,
            overflowY: 'auto',
            bgcolor: '#0a0e1a',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout
