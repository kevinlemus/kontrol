import { Platform, PlatformDraft, PostType, PLATFORM_POST_TYPES } from './types'

interface CardHeroProps {
  platform: Platform
  draft: PlatformDraft
  desktop?: boolean
  onTypeChange: (postType: PostType) => void
}

export function CardHero({ platform, draft, desktop, onTypeChange }: CardHeroProps) {
  const postTypes = PLATFORM_POST_TYPES[platform.id]
  const selectedType = draft.selectedPostType
  const heroHeight = desktop ? 88 : 52
  const subreddit = draft.subreddit ?? `@kontrol_${platform.id.toLowerCase()}`
  const charCount = draft.content.length
  const maxChars: Record<string, number> = {
    tweet: 280,
    post: 2200,
    short: 150,
    reel: 2200,
    text: 40000,
    announcement: 5000,
    devlog: 8000,
    story: 150,
  }
  const max = maxChars[selectedType] ?? 2200

  const hasPillRow = postTypes !== undefined && postTypes.length > 1

  return (
    <div style={{
      position: 'relative',
      height: hasPillRow ? heroHeight + 40 : heroHeight,
      borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Gradient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: platform.gradient,
      }} />

      {/* Fade overlay to card bg */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, transparent 50%, #181818 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px 14px 10px 14px',
      }}>
        {/* Top row: post type badge + now editing dot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 8px',
          }}>
            {selectedType}
          </span>

          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 8px',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#1ED760',
              display: 'inline-block',
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }} />
            now editing
          </span>
        </div>

        {/* Middle row: platform name + account/char count */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: desktop ? 48 : 36,
            lineHeight: 0.9,
            color: '#fff',
            letterSpacing: -2,
            textShadow: '0 2px 16px rgba(0,0,0,0.4)',
          }}>
            {platform.name}
          </span>

          <div style={{
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.65)',
            }}>
              {subreddit}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9.5,
              color: charCount > max ? '#FF4500' : 'rgba(255,255,255,0.45)',
            }}>
              {charCount}/{max}
            </span>
          </div>
        </div>

        {/* Post type pill selector — only for multi-type platforms */}
        {hasPillRow && postTypes && (
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            padding: '0 0 16px',
          }}>
            {postTypes.map(type => {
              const isSelected = type === selectedType
              return (
                <button
                  key={type}
                  onClick={() => onTypeChange(type)}
                  style={{
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: 0.5,
                    fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    color: isSelected ? '#000000' : 'rgba(255,255,255,0.6)',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.25)',
                    cursor: 'pointer',
                    transition: 'background .15s, color .15s',
                    textTransform: 'lowercase',
                  }}
                >
                  {type}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
