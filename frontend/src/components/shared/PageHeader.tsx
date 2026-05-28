import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../shared/Toast'

interface PageHeaderProps {
  title: string
  rightSlot?: React.ReactNode
}

function AvatarBadge({ size = 28 }: { size?: number }) {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const initial = (user?.name ?? '').trim().charAt(0).toUpperCase() || 'K'

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleSettings = () => {
    setOpen(false)
    navigate('/settings')
  }

  const handleLogout = () => {
    setOpen(false)
    Object.keys(localStorage)
      .filter(k => k.startsWith('kontrol_'))
      .forEach(k => localStorage.removeItem(k))
    logout()
    showToast('Logged out successfully')
    navigate('/login')
  }

  const menuItemBase: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'block',
    boxSizing: 'border-box',
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Profile menu"
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
          touchAction: 'manipulation',
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

      {open && (
        <div style={{
          position: 'absolute',
          top: size + 6,
          right: 0,
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '4px 0',
          minWidth: 140,
          zIndex: 9999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          <MenuButton
            onClick={handleSettings}
            style={{ ...menuItemBase, color: 'var(--text-secondary)' }}
          >
            Settings
          </MenuButton>
          <MenuButton
            onClick={handleLogout}
            style={{ ...menuItemBase, color: 'rgba(239,68,68,0.85)' }}
          >
            Log out
          </MenuButton>
        </div>
      )}
    </div>
  )
}

function MenuButton({
  onClick,
  style,
  children,
}: {
  onClick: () => void
  style: React.CSSProperties
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        background: hovered ? 'rgba(255,255,255,0.05)' : 'none',
        color: hovered ? '#fff' : style.color,
      }}
    >
      {children}
    </button>
  )
}

export function PageHeader({ title, rightSlot }: PageHeaderProps) {
  return (
    <header style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'end',
      minHeight: 'calc(52px + max(env(safe-area-inset-top), 47px))',
      padding: '0 16px',
      paddingTop: 'max(env(safe-area-inset-top), 47px)',
      paddingBottom: 10,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      flexShrink: 0,
      background: 'var(--bg-base)',
      gap: 8,
      position: 'relative',
      zIndex: 20,
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
      }}>
        {rightSlot}
        {/* Avatar badge — opens dropdown with Settings and Log out */}
        <AvatarBadge size={32} />
      </div>
    </header>
  )
}

// FRONTEND-AGENT: PageHeader complete
