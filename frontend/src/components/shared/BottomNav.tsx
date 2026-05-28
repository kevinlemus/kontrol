import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  {
    path: '/projects',
    label: 'Projects',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="3" width="8" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="12" y="3" width="8" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2" y="12" width="8" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="12" y="12" width="8" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    path: '/compose',
    label: 'Compose',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 19l1-4 12-12a2.2 2.2 0 013 3l-12 12-4 1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M13 5l3 3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    path: '/schedule',
    label: 'Schedule',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 5.5v5.5l3.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    path: '/reddit',
    label: 'Reddit',
    icon: (
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 800, lineHeight: 1 }}>r/</span>
    ),
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="14" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="9" y="9" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="16" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      background: 'linear-gradient(180deg, #181818 0%, #0a0a0a 100%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '8px 8px 8px',
      paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      display: 'flex',
      gap: 4,
      flexShrink: 0,
    }}>
      {TABS.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 8px 8px',
              background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-button)',
              position: 'relative',
              transition: 'color .15s ease',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 3,
                borderRadius: 2,
                background: 'var(--accent)',
                boxShadow: '0 0 12px rgba(59,130,246,0.5)',
              }} />
            )}
            <span style={{
              width: 22,
              height: 22,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              letterSpacing: -0.1,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
