import { PlatformId, PlatformDraft } from './types'
import { PLATFORMS } from './mockData'
import { QueueRow } from './QueueRow'
import { Toggle } from '../shared/Toggle'

interface PlatformQueueProps {
  drafts: Record<PlatformId, PlatformDraft>
  activePlatformId: PlatformId
  onSelectPlatform: (id: PlatformId) => void
  enabledPlatforms: PlatformId[]
  selectedPlatforms: PlatformId[]
  onTogglePlatform: (id: PlatformId) => void
}

export function PlatformQueue({
  drafts,
  activePlatformId,
  onSelectPlatform,
  enabledPlatforms,
  selectedPlatforms,
  onTogglePlatform,
}: PlatformQueueProps) {
  const visiblePlatforms = PLATFORMS.filter(p => enabledPlatforms.includes(p.id))

  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      background: '#101010',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Queue header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Platform Queue
        </div>
      </div>

      {/* Queue rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {visiblePlatforms.map(platform => {
          const isSelected = selectedPlatforms.includes(platform.id)
          return (
            <div
              key={platform.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 10,
                gap: 0,
              }}
            >
              {/* Toggle — click does not propagate to the QueueRow button */}
              <div
                onClick={e => e.stopPropagation()}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
              >
                <Toggle
                  checked={isSelected}
                  onChange={() => onTogglePlatform(platform.id)}
                />
              </div>

              {/* QueueRow — thumbnail + text + status; faded when deselected */}
              <div
                style={{
                  flex: 1,
                  opacity: isSelected ? 1 : 0.4,
                  transition: 'opacity .15s',
                  pointerEvents: isSelected ? 'auto' : 'none',
                }}
              >
                <QueueRow
                  platform={platform}
                  draft={drafts[platform.id]}
                  isActive={platform.id === activePlatformId}
                  onClick={() => onSelectPlatform(platform.id)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
