import React from 'react'

interface TopBarProps {
  projectName: string
  onProjectChange?: () => void
}

export function TopBar({ projectName, onProjectChange }: TopBarProps) {
  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Wordmark */}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 18,
        letterSpacing: -0.5,
        background: 'linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.5) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        kontrol
      </span>

      {/* Project selector */}
      <button
        onClick={onProjectChange}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-raised)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-pill)',
          padding: '5px 12px 5px 10px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        <span style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #FF4500, #FF6534)',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: -0.1,
        }}>
          {projectName}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
