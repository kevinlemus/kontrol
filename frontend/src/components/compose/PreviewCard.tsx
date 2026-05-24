import React from 'react'
import { PlatformDraft, Platform, ViewMode, PostType } from './types'

interface PreviewCardProps {
  draft: PlatformDraft
  platform: Platform
  selectedPostType: PostType
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void  // kept for API compatibility
}

// ─── Instagram previews ──────────────────────────────────────────────────────

function IGPostPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 320, margin: '0 auto', width: '100%' }}>
      {/* Post header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #F58529, #DD2A7B)' }} />
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5 }}>kontrol_account</span>
      </div>
      {/* 4:5 image frame */}
      <div style={{
        width: '100%',
        height: 280,
        background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Photo placeholder (top 75%) */}
        <div style={{
          flex: '0 0 75%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ opacity: 0.4 }}>
            <rect x="2" y="5" width="24" height="18" rx="2" stroke="white" strokeWidth="1.5" />
            <circle cx="9" cy="11" r="2" stroke="white" strokeWidth="1.5" />
            <path d="M2 18l6-5 4 3.5 4-4 8 6" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        {/* Caption area (bottom 25%) */}
        <div style={{
          flex: '0 0 25%',
          background: '#181818',
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3,
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
            {draft.content.slice(0, 80)}{draft.content.length > 80 ? '...' : ''}
          </div>
          {draft.hashtags && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              {draft.hashtags.slice(0, 3).map(t => `#${t}`).join(' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IGStoryPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 180,
        height: 320,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
        margin: '0 auto',
      }}>
        {/* Progress segments at top */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          display: 'flex',
          gap: 3,
          zIndex: 2,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1,
              height: 2.5,
              borderRadius: 999,
              background: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
            }} />
          ))}
        </div>
        {/* Avatar + label */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 2,
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#fff',
            border: '1.5px solid white',
          }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#fff', fontWeight: 600 }}>
            Your Story
          </span>
        </div>
        {/* Caption centered */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          zIndex: 1,
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            textAlign: 'center',
            textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          }}>
            {draft.content.slice(0, 100)}{draft.content.length > 100 ? '...' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function IGReelPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 180,
        height: 320,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)',
        margin: '0 auto',
      }}>
        {/* Reels label top-left */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          color: '#fff',
          zIndex: 2,
        }}>
          Reels
        </div>
        {/* Play button center */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <polygon points="18,12 38,24 18,36" fill="white" opacity="0.85" />
          </svg>
        </div>
        {/* Bottom caption overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
          zIndex: 2,
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: '#fff',
            lineHeight: 1.4,
          }}>
            {draft.content.slice(0, 80)}{draft.content.length > 80 ? '...' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function InstagramPreview({ draft }: { draft: PlatformDraft }) {
  const type = draft.selectedPostType
  if (type === 'story') return <IGStoryPreview draft={draft} />
  if (type === 'reel') return <IGReelPreview draft={draft} />
  return <IGPostPreview draft={draft} />
}

// ─── TikTok previews ─────────────────────────────────────────────────────────

function TTPostPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 180,
        height: 320,
        background: '#010101',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 10,
      }}>
        {/* Top: username */}
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
          @kontrol_tt
        </div>
        {/* On-screen text */}
        {draft.onScreenText && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            padding: '0 4px',
          }}>
            {draft.onScreenText}
          </div>
        )}
        {/* Bottom: caption + action rail row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Left: caption */}
          <div style={{
            flex: 1,
            paddingRight: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.4,
          }}>
            <div style={{ marginBottom: 4, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(105,201,208,0.7)' }}>
              ♪ Original Sound
            </div>
            {draft.content.slice(0, 60)}{draft.content.length > 60 ? '...' : ''}
          </div>
          {/* Right: action rail */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12.5C7 12.5 1.5 8.8 1.5 5.5C1.5 3.6 3 2 5 2C5.9 2 6.7 2.4 7 3C7.3 2.4 8.1 2 9 2C11 2 12.5 3.6 12.5 5.5C12.5 8.8 7 12.5 7 12.5Z" stroke="white" strokeWidth="1.2" fill="none" />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>0</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h10v8H8l-4 2V10H2z" stroke="white" strokeWidth="1.2" fill="none" />
              </svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(255,255,255,0.6)' }}>0</span>
            </div>
          </div>
        </div>
        {/* TT color accent bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, #69C9D0, #010101)',
        }} />
      </div>
    </div>
  )
}

function TTStoryPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 180,
        height: 320,
        background: 'linear-gradient(135deg, #010101, #69C9D0)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
      }}>
        {/* STORY badge */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: 'rgba(255,255,255,0.9)',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          borderRadius: 999,
          padding: '3px 10px',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          STORY
        </div>
        {/* Caption */}
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {draft.content.slice(0, 80)}{draft.content.length > 80 ? '...' : ''}
        </span>
      </div>
    </div>
  )
}

function TikTokPreview({ draft }: { draft: PlatformDraft }) {
  const type = draft.selectedPostType
  if (type === 'story') return <TTStoryPreview draft={draft} />
  return <TTPostPreview draft={draft} />
}

// ─── YouTube previews ─────────────────────────────────────────────────────────

function YTShortPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 180,
        height: 320,
        background: '#0f0f0f',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Red top bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: '#FF0000',
        }} />
        {/* Shorts label */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 2,
        }}>
          {/* YouTube Shorts icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#FF0000" strokeWidth="1.5" />
            <polygon points="5.5,4.5 10,7 5.5,9.5" fill="white" />
          </svg>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
            Shorts
          </span>
        </div>
        {/* Play button center */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <polygon points="18,12 38,24 18,36" fill="white" opacity="0.85" />
          </svg>
        </div>
        {/* Bottom title overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 12px 12px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
          zIndex: 2,
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.4,
          }}>
            {draft.content.slice(0, 60)}{draft.content.length > 60 ? '...' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function YTPostPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 340,
      margin: '0 auto',
      width: '100%',
    }}>
      {/* 16:9 thumbnail */}
      <div style={{
        width: '100%',
        height: 160,
        borderRadius: 8,
        background: '#272727',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.35)' }}>&#9654;</span>
      </div>
      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
        lineHeight: 1.4,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {draft.content.slice(0, 100)}{draft.content.length > 100 ? '...' : ''}
      </div>
      {/* Meta row */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          @kontrol_yt
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>•</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          — views
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>•</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          just now
        </span>
      </div>
    </div>
  )
}

function YouTubePreview({ draft }: { draft: PlatformDraft }) {
  const type = draft.selectedPostType
  if (type === 'post') return <YTPostPreview draft={draft} />
  return <YTShortPreview draft={draft} />
}

function LinkedInPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{
      background: '#1B1F23',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.08)',
      padding: 14,
      maxWidth: 360,
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A66C2, #0077B5)' }} />
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: '#fff' }}>Kevin L.</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>Solo dev • just now</div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
        {draft.content.slice(0, 200)}{draft.content.length > 200 ? '...' : ''}
      </div>
    </div>
  )
}

function RedditPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <div style={{
      background: '#1A1A1B',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.07)',
      padding: 12,
      maxWidth: 360,
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#FF6534' }}>{draft.subreddit}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>• posted by u/kevin</span>
      </div>
      {draft.title && (
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13.5, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>
          {draft.title}
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
        {draft.content.slice(0, 180)}{draft.content.length > 180 ? '...' : ''}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1l1.5 3h3l-2.5 2 1 3L5 7.5 2 9l1-3L.5 4h3z" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)' }}>vote</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>💬 comment</div>
      </div>
    </div>
  )
}

function XPreview({ draft }: { draft: PlatformDraft }) {
  const charCount = draft.content.length
  const max = 280
  const pct = Math.min((charCount / max) * 100, 100)
  const circumference = 2 * Math.PI * 10
  const strokeDash = circumference * (pct / 100)

  return (
    <div style={{
      background: '#16181C',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)',
      padding: 14,
      maxWidth: 340,
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2A2A2A', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#fff' }}>Kevin</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>@kvn_dev</span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#fff', lineHeight: 1.5 }}>
            {draft.content.slice(0, 280)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
              <circle
                cx="12" cy="12" r="10"
                fill="none"
                stroke={charCount > 260 ? '#FF4500' : '#3B82F6'}
                strokeWidth="2"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 12 12)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function GenericPreview({ draft, platform }: { draft: PlatformDraft; platform: Platform }) {
  return (
    <div style={{
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      maxWidth: 360,
      margin: '0 auto',
    }}>
      <div style={{ height: 32, background: platform.gradient, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: '#fff' }}>{platform.name}</span>
      </div>
      {draft.title && (
        <div style={{ padding: '10px 12px 4px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#fff', background: '#1A1A1A', lineHeight: 1.4 }}>
          {draft.title}
        </div>
      )}
      <div style={{ padding: '8px 12px 12px', fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--text-secondary)', background: '#1A1A1A', lineHeight: 1.6 }}>
        {draft.content.slice(0, 200)}{draft.content.length > 200 ? '...' : ''}
      </div>
    </div>
  )
}

export function PreviewCard({ draft, platform, selectedPostType: _selectedPostType, viewMode, onViewModeChange }: PreviewCardProps) {
  function renderPreview() {
    switch (platform.id) {
      case 'IG': return <InstagramPreview draft={draft} />
      case 'TT': return <TikTokPreview draft={draft} />
      case 'YT': return <YouTubePreview draft={draft} />
      case 'LI': return <LinkedInPreview draft={draft} />
      case 'RD': return <RedditPreview draft={draft} />
      case 'X': return <XPreview draft={draft} />
      default: return <GenericPreview draft={draft} platform={platform} />
    }
  }

  return (
    <div style={{ padding: '0 14px 14px' }}>
      {/* Preview content */}
      {renderPreview()}
    </div>
  )
}
