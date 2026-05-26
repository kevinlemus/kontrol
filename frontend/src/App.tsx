import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { BottomNav } from './components/shared/BottomNav'
import { ToastProvider } from './components/shared/Toast'
import { OfflineBanner } from './components/shared/OfflineBanner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProjectsPage } from './pages/ProjectsPage'
import { ComposePage } from './pages/ComposePage'
import { SchedulePage } from './pages/SchedulePage'
import { RedditPage } from './pages/RedditPage'
import { SettingsPage } from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'

const NO_NAV_PATHS = ['/login', '/register', '/onboarding', '/settings']

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppShell() {
  const location = useLocation()
  const showNav = !NO_NAV_PATHS.includes(location.pathname)

  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Onboarding — requires auth */}
            <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

            {/* All app routes — require auth */}
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
        <OfflineBanner />
      </div>
    </ToastProvider>
  )
}

export default function App() {
  // Clear any localStorage entries that contain non-UUID project IDs (legacy slug format)
  useEffect(() => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const KEYS_TO_CHECK = ['kontrol_projects', 'kontrol_active_project', 'kontrol_drafts']
    for (const key of KEYS_TO_CHECK) {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        // If it's an array with an id field that isn't a UUID, clear it
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && !UUID_RE.test(parsed[0].id)) {
          localStorage.removeItem(key)
        }
        // If it's a string that looks like a slug (contains letters and hyphens, no UUID format), clear it
        if (typeof parsed === 'string' && !UUID_RE.test(parsed)) {
          localStorage.removeItem(key)
        }
      } catch {
        localStorage.removeItem(key)
      }
    }
  }, [])

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
