import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastContextValue {
  showToast: (message: string, duration?: number) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ToastState {
  message: string
  visible: boolean
  exiting: boolean
  key: number
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keyRef = useRef(0)

  const clearTimers = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
  }

  const showToast = useCallback((message: string, duration = 2500) => {
    clearTimers()
    keyRef.current += 1
    const key = keyRef.current

    // Mount immediately visible
    setToast({ message, visible: true, exiting: false, key })

    // Begin exit animation before removal
    dismissTimerRef.current = setTimeout(() => {
      setToast(prev => prev?.key === key ? { ...prev, exiting: true } : prev)
      exitTimerRef.current = setTimeout(() => {
        setToast(prev => prev?.key === key ? null : prev)
      }, 220)
    }, duration)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(52px + max(env(safe-area-inset-top), 47px) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 500,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(30,30,30,0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 24,
              padding: '10px 20px',
              maxWidth: 320,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              transition: 'transform 200ms ease, opacity 200ms ease',
              transform: toast.exiting ? 'translateY(-20px)' : 'translateY(0)',
              opacity: toast.exiting ? 0 : 1,
            }}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

// FRONTEND-AGENT: Toast complete
