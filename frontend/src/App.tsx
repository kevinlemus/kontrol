import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { BottomNav } from './components/shared/BottomNav'
import { ToastProvider } from './components/shared/Toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProjectsPage } from './pages/ProjectsPage'
import { ComposePage } from './pages/ComposePage'
import { SchedulePage } from './pages/SchedulePage'
import { RedditPage } from './pages/RedditPage'
import { SettingsPage } from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppShell() {
  const location = useLocation()
  const showNav = location.pathname !== '/settings' && location.pathname !== '/login'

  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
              <RequireAuth>
                <Routes>
                  <Route path="/" element={<Navigate to="/compose" replace />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/compose" element={<ComposePage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/reddit" element={<RedditPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </RequireAuth>
            } />
          </Routes>
        </main>
        {showNav && <BottomNav />}
      </div>
    </ToastProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
