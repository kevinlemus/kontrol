import React from 'react'
import { Platform, PlatformDraft } from './types'

interface QueueRowProps {
  platform: Platform
  draft: PlatformDraft
  isActive: boolean
  onClick: () => void
}

export function QueueRow({ platform, draft, isActive, onClick }: QueueRowProps) {
  const { status } = draft

  function renderStatusIcon() {
    if (status === 'approved') {
      return (
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#1ED760',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )
    }

    if (status === 'skipped') {
      return (
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '1.5px solid #3A3A3A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1l6 6M7 1L1 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )
    }

    if (isActive || status === 'generating') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
          height: 22,
          paddingBottom: 4,
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 3,
                height: 10,
                borderRadius: 1.5,
                background: '#3B82F6',
                animation: `eq-bar 0.${6 + i * 2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      )
    }

    // Pending / draft
    return (
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.15)',
      }} />
    )
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        background: isActive ? 'var(--bg-raised)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background .15s',
        textAlign: 'left',
      }}
    >
      {/* Active left accent bar */}
      {isActive && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: 32,
          borderRadius: '0 2px 2px 0',
          background: 'var(--accent)',
        }} />
      )}

      {/* Platform thumbnail */}
      <div style={{
        width: 46,
        height: 46,
        borderRadius: 10,
        background: platform.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: status === 'skipped' ? 'grayscale(1)' : 'none',
        opacity: status === 'skipped' ? 0.5 : 1,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 15,
          color: '#fff',
          letterSpacing: -0.3,
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
          {platform.id}
        </span>
      </div>

      {/* Text info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 13.5,
          color: status === 'skipped' ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: status === 'skipped' ? 'line-through' : 'none',
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {platform.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {platform.postType}
        </div>
      </div>

      {/* Status icon */}
      {renderStatusIcon()}
    </button>
  )
}
