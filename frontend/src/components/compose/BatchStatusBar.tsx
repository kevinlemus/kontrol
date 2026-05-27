import { PlatformId, PlatformDraft } from './types'
import { PLATFORMS } from './mockData'

interface BatchStatusBarProps {
  drafts: Record<PlatformId, PlatformDraft>
  activePlatformId: PlatformId
  enabledPlatforms: PlatformId[]
  desktop?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  approved: '#1ED760',
  skipped: '#6A6A6A',
  draft: '#3B82F6',
  generating: '#F59E0B',
  pending: '#2A2A2A',
}

export function BatchStatusBar({ drafts, activePlatformId, enabledPlatforms, desktop }: BatchStatusBarProps) {
  const visiblePlatforms = PLATFORMS.filter(p => enabledPlatforms.includes(p.id))
  // drafts[p.id] can be undefined before generation — filter out nullish entries for counters
  const visibleDrafts = visiblePlatforms.map(p => drafts[p.id]).filter((d): d is PlatformDraft => d != null)
  const approved = visibleDrafts.filter(d => d.status === 'approved').length
  const skipped = visibleDrafts.filter(d => d.status === 'skipped').length
  const left = visibleDrafts.filter(d => d.status === 'pending' || d.status === 'draft').length

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: desktop ? '6px 0' : '6px 14px',
      flexShrink: 0,
    }}>
      {/* Segments */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 2,
        height: 4,
      }}>
        {visiblePlatforms.map(platform => {
          const draft = drafts[platform.id]
          const draftStatus = draft?.status ?? 'pending'
          const isActive = platform.id === activePlatformId
          const color = isActive
            ? '#3B82F6'
            : STATUS_COLORS[draftStatus] ?? '#2A2A2A'

          return (
            <div
              key={platform.id}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: color,
                opacity: isActive ? 1 : draftStatus === 'pending' ? 0.6 : 1,
                transition: 'background .3s',
              }}
            />
          )
        })}
      </div>

      {/* Counters */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
        letterSpacing: 0,
      }}>
        {approved > 0 && <span style={{ color: '#1ED760' }}>{approved} done</span>}
        {approved > 0 && skipped > 0 && <span> · </span>}
        {skipped > 0 && <span style={{ color: '#6A6A6A' }}>{skipped} skipped</span>}
        {(approved > 0 || skipped > 0) && left > 0 && <span> · </span>}
        {left > 0 && <span>{left} left</span>}
      </span>
    </div>
  )
}
