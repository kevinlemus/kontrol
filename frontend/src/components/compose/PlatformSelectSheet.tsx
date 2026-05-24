import { PlatformId } from './types'
import { PLATFORMS } from './mockData'
import { Toggle } from '../shared/Toggle'

interface PlatformSelectSheetProps {
  enabledPlatforms: PlatformId[]
  selectedPlatforms: PlatformId[]
  onToggle: (id: PlatformId) => void
  onClose: () => void
}

export function PlatformSelectSheet({
  enabledPlatforms,
  selectedPlatforms,
  onToggle,
  onClose,
}: PlatformSelectSheetProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 16px 36px',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: 36,
          height: 4,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 20px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <span style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}>
            Select platforms
          </span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {selectedPlatforms.length} selected
          </span>
        </div>

        {/* Platform list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          {PLATFORMS.filter(p => enabledPlatforms.includes(p.id)).map(platform => {
            const isSelected = selectedPlatforms.includes(platform.id)
            return (
              <div
                key={platform.id}
                onClick={() => onToggle(platform.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 4px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  opacity: isSelected ? 1 : 0.5,
                  transition: 'opacity .15s',
                }}
              >
                {/* Gradient swatch */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: platform.gradient,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                }}>
                  {platform.id}
                </div>

                {/* Name */}
                <span style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                }}>
                  {platform.name}
                </span>

                {/* Toggle — stop propagation so the row click doesn't double-fire */}
                <div onClick={e => e.stopPropagation()}>
                  <Toggle checked={isSelected} onChange={() => onToggle(platform.id)} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Done button */}
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px 0',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: -0.2,
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
