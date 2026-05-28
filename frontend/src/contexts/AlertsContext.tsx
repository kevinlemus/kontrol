import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { analyticsApi } from '../api/analyticsApi'
import { projectsApi } from '../api/projects'
import { useAuth } from './AuthContext'
import type { AnalyticsAlert } from '../api/analyticsApi'

interface AlertsContextValue {
  alerts: AnalyticsAlert[]
  dismissAlert: (idx: number) => void
  refetch: () => void
}

const AlertsContext = createContext<AlertsContextValue>({
  alerts: [],
  dismissAlert: () => {},
  refetch: () => {},
})

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  const fetchAlerts = useCallback((projectId: string) => {
    analyticsApi.alerts(projectId)
      .then(setAlerts)
      .catch(() => { /* backend offline — no alerts */ })
  }, [])

  // Resolve active project once user is known
  useEffect(() => {
    if (!user) { setAlerts([]); return }
    projectsApi.list()
      .then(list => {
        const active = list?.find(p => p.active)
        if (active?.id) {
          setActiveProjectId(active.id)
          fetchAlerts(active.id)
        }
      })
      .catch(() => {})
  }, [user, fetchAlerts])

  const dismissAlert = useCallback((idx: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const refetch = useCallback(() => {
    if (activeProjectId) fetchAlerts(activeProjectId)
  }, [activeProjectId, fetchAlerts])

  return (
    <AlertsContext.Provider value={{ alerts, dismissAlert, refetch }}>
      {children}
    </AlertsContext.Provider>
  )
}

export function useAlerts(): AlertsContextValue {
  return useContext(AlertsContext)
}
