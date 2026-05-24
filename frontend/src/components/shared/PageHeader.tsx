import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  rightSlot?: React.ReactNode
}

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.55 3.55l1.41 1.41M13.04 13.04l1.41 1.41M3.55 14.45l1.41-1.41M13.04 4.96l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export function PageHeader({ title, rightSlot }: PageHeaderProps) {
  const navigate = useNavigate()
  const [gearHovered, setGearHovered] = useState(false)

  return (
    <header style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      height: 52,
      padding: '0 16px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      flexShrink: 0,
      background: 'var(--bg-base)',
      gap: 8,
    }}>
      {/* Column 1: wordmark — left-aligned */}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 18,
        fontWeight: 800,
        background: 'linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.5) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: -0.5,
        justifySelf: 'start',
      }}>
        kontrol
      </span>

      {/* Column 2: page title — centered in its own auto column */}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: -0.2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center',
      }}>
        {title}
      </span>

      {/* Column 3: rightSlot + gear — right-aligned */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifySelf: 'end',
        overflow: 'hidden',
      }}>
        {rightSlot}
        <button
          onClick={() => navigate('/settings')}
          onMouseEnter={() => setGearHovered(true)}
          onMouseLeave={() => setGearHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: gearHovered ? 'var(--text-primary)' : 'var(--text-muted)',
            transition: 'color 0.15s ease',
            padding: 0,
            flexShrink: 0,
          }}
          aria-label="Settings"
        >
          <GearIcon />
        </button>
      </div>
    </header>
  )
}

// FRONTEND-AGENT: PageHeader complete
