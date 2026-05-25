import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface PageHeaderProps {
  title: string
  rightSlot?: React.ReactNode
}

function AvatarBadge({ size = 28 }: { size?: number }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initial = (user?.name ?? '').trim().charAt(0).toUpperCase() || 'K'

  return (
    <button
      onClick={() => navigate('/settings')}
      aria-label="Profile settings"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: user?.avatarUrl ? 'transparent' : '#3B82F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1.5px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user?.name ?? 'Profile'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{
          fontSize: size * 0.44,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'var(--font-body)',
          lineHeight: 1,
        }}>
          {initial}
        </span>
      )}
    </button>
  )
}

export function PageHeader({ title, rightSlot }: PageHeaderProps) {
  const navigate = useNavigate()
  const [gearHovered, setGearHovered] = useState(false)

  return (
    <header style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'end',
      minHeight: 'calc(52px + env(safe-area-inset-top))',
      padding: '0 16px',
      paddingTop: 'env(safe-area-inset-top)',
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

      {/* Column 3: rightSlot + avatar + gear — right-aligned */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifySelf: 'end',
        overflow: 'hidden',
      }}>
        {rightSlot}
        {/* Avatar badge navigates to settings */}
        <AvatarBadge size={32} />
        {/* Gear icon as fallback / additional entry point */}
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
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.55 3.55l1.41 1.41M13.04 13.04l1.41 1.41M3.55 14.45l1.41-1.41M13.04 4.96l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  )
}

// FRONTEND-AGENT: PageHeader complete
