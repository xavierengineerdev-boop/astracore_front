import './styles/global.css'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getTheme } from './theme/index'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import GlobalLoader from './components/GlobalLoader'
import MainLayout from './components/MainLayout'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/Users'
import UserCardPage from './pages/UserCard'
import DepartmentsPage from './pages/Departments'
import DepartmentCardPage from './pages/DepartmentCard'
import LeadsPage from './pages/Leads'
import LeadCardPage from './pages/LeadCard'
import StatisticsPage from './pages/Statistics'

function App() {
  const muiTheme = getTheme('dark')

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ToastProvider>
<AuthProvider>
        <GlobalLoader />
        <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:id" element={<UserCardPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="departments/:id" element={<DepartmentCardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/:id" element={<LeadCardPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
