import React from 'react'
import { PlatformDraft, Platform } from './types'
import { SubredditSelector } from './SubredditSelector'

interface CardContentProps {
  draft: PlatformDraft
  platform: Platform
  onContentChange: (content: string) => void
  onTitleChange?: (title: string) => void
  onEditSaved: (original: string, edited: string) => void
  originalContent: string
  projectId?: string
  onSubredditChange?: (subreddit: string) => void
}

export function CardContent({ draft, platform, onContentChange, onTitleChange, onEditSaved, originalContent, projectId, onSubredditChange }: CardContentProps) {
  const hasTitle = ['RD', 'ST', 'IT', 'GJ'].includes(platform.id)

  return (
    <div style={{
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flex: 1,
    }}>
      {/* Title field (Reddit, Steam, itch.io, GameJolt) */}
      {hasTitle && draft.title !== undefined && (
        <input
          type="text"
          value={draft.title}
          onChange={e => onTitleChange?.(e.target.value)}
          placeholder="post title..."
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '8px 10px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 14,
            outline: 'none',
            transition: 'border-color .15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      )}

      {/* Subreddit selector (Reddit only) */}
      {platform.id === 'RD' && (
        <SubredditSelector
          selectedSubreddit={draft.subreddit}
          reasoning={draft.subredditReasoning}
          projectId={projectId ?? null}
          onSelect={(sub) => onSubredditChange?.(sub)}
        />
      )}

      {/* Post content textarea */}
      <textarea
        value={draft.content}
        onChange={e => onContentChange(e.target.value)}
        onBlur={e => {
          const edited = e.currentTarget.value
          if (edited !== originalContent && edited.trim() !== '') {
            onEditSaved(originalContent, edited)
          }
        }}
        style={{
          flex: 1,
          minHeight: 100,
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 10,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 13.5,
          lineHeight: 1.6,
          resize: 'none',
          outline: 'none',
        }}
      />

      {/* Hashtags (Instagram) */}
      {draft.hashtags && draft.hashtags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 5,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 8,
        }}>
          {draft.hashtags.map(tag => (
            <span key={tag} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--accent)',
              background: 'rgba(59,130,246,0.1)',
              borderRadius: 'var(--radius-pill)',
              padding: '2px 8px',
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* TikTok on-screen text */}
      {draft.onScreenText && (
        <div style={{
          background: 'rgba(105,201,208,0.08)',
          border: '1px solid rgba(105,201,208,0.15)',
          borderRadius: 8,
          padding: '7px 10px',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            color: 'rgba(105,201,208,0.7)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            display: 'block',
            marginBottom: 3,
          }}>
            on-screen text
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: '#69C9D0',
          }}>
            {draft.onScreenText}
          </span>
        </div>
      )}
    </div>
  )
}
