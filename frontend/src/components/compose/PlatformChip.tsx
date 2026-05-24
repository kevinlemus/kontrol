import { Platform, PlatformDraft } from './types'

interface PlatformChipProps {
  platform: Platform
  draft: PlatformDraft
  isActive: boolean
  onClick: () => void
}

export function PlatformChip({ platform, draft, isActive, onClick }: PlatformChipProps) {
  const { status } = draft

  const isApproved = status === 'approved'
  const isSkipped = status === 'skipped'
  const isPending = status === 'pending'

  return (
    <button
      onClick={onClick}
      style={{
        width: 96,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '8px 4px',
        paddingBottom: isActive ? 0 : 8,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transform: isActive ? 'translateY(-2px)' : 'none',
        transition: 'transform .15s ease',
        // Active chip: remove bottom border so it merges with card below
        borderBottom: isActive ? '8px solid var(--bg-card)' : 'none',
        position: 'relative',
        zIndex: isActive ? 2 : 1,
      }}
    >
      {/* Gradient thumbnail */}
      <div style={{
        width: 54,
        height: 54,
        borderRadius: 'var(--radius-chip)',
        background: platform.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: isPending ? 0.5 : 1,
        outline: isPending ? '1.5px dashed rgba(255,255,255,0.25)' : 'none',
        outlineOffset: isPending ? 2 : 0,
        filter: isSkipped ? 'grayscale(1)' : 'none',
        boxShadow: isActive
          ? '0 0 0 2px #181818, 0 0 0 4px #3B82F6'
          : 'none',
        transition: 'box-shadow .15s, opacity .15s',
      }}>
        {/* Platform abbreviation */}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 18,
          color: '#fff',
          letterSpacing: -0.5,
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
          {platform.id}
        </span>

        {/* Approved badge */}
        {isApproved && (
          <div style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#1ED760',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #181818',
          }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 4.5l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Active EQ bars */}
        {isActive && (
          <div style={{
            position: 'absolute',
            bottom: 5,
            right: 5,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 2.5,
                  height: 8,
                  borderRadius: 1,
                  background: 'rgba(255,255,255,0.9)',
                  animation: `eq-bar 0.${6 + i * 2}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Platform name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11.5,
          fontWeight: 600,
          color: isSkipped ? 'var(--text-muted)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          textDecoration: isSkipped ? 'line-through' : 'none',
          letterSpacing: -0.1,
        }}>
          {platform.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 1,
        }}>
          {platform.postType}
        </div>
      </div>
    </button>
  )
}
