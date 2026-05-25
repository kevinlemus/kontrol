import { PlatformId, PlatformDraft } from './types'
import { PLATFORMS } from './mockData'
import { PlatformChip } from './PlatformChip'

interface ChipStripProps {
  drafts: Record<PlatformId, PlatformDraft>
  activePlatformId: PlatformId
  onSelectPlatform: (id: PlatformId) => void
  enabledPlatforms: PlatformId[]
}

export function ChipStrip({ drafts, activePlatformId, onSelectPlatform, enabledPlatforms }: ChipStripProps) {
  const visiblePlatforms = PLATFORMS.filter(p => enabledPlatforms.includes(p.id))
  return (
    <div
      style={{
        display: 'flex',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        flexShrink: 0,
        // Hide scrollbar
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        // Padding so chips don't clip on edges
        paddingLeft: 6,
        paddingRight: 6,
        // Match background so active chip bottom merges with card below
        background: 'var(--bg-base)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <style>{`
        .chip-strip::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        className="chip-strip"
        style={{
          display: 'flex',
          gap: 0,
          minWidth: 'max-content',
        }}
      >
        {visiblePlatforms.map(platform => (
          <PlatformChip
            key={platform.id}
            platform={platform}
            draft={drafts[platform.id]}
            isActive={platform.id === activePlatformId}
            onClick={() => onSelectPlatform(platform.id)}
          />
        ))}
      </div>
    </div>
  )
}
