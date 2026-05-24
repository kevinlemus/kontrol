import React, { useState, useRef, useCallback, useEffect } from 'react'
import { PlatformDraft, Platform, ViewMode, PostType } from './types'
import { CardHero } from './CardHero'
import { CardContent } from './CardContent'
import { ActionRow } from './ActionRow'
import { PreviewCard } from './PreviewCard'
import { ConfidenceIndicator } from './ConfidenceIndicator'
import { useToast } from '../shared/Toast'
import type { PerformanceInsightDto } from '../../api/types'

interface ActiveCardProps {
  draft: PlatformDraft
  platform: Platform
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
  onTypeChange: (postType: PostType) => void
  onApprove: () => void
  onRegenerate: () => void
  onSkip: () => void
  onDiscardBatch: () => void
  desktop?: boolean
  projectName: string
  projectId?: string
  onSubredditChange?: (subreddit: string) => void
  insights?: PerformanceInsightDto[] | null
}

export function ActiveCard({
  draft,
  platform,
  onContentChange,
  onTitleChange,
  onTypeChange,
  onApprove,
  onRegenerate,
  onSkip,
  onDiscardBatch,
  desktop,
  projectName,
  projectId,
  onSubredditChange,
  insights,
}: ActiveCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('edit')
  const [flash, setFlash] = useState(false)
  const originalContentRef = useRef<string>(draft.content)
  const { showToast } = useToast()

  // Three-dot menu state
  const [menuOpen, setMenuOpen] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const discardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    originalContentRef.current = draft.content
    setFlash(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.platformId])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setDiscardConfirm(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  // Reset discard confirm after 3s
  useEffect(() => {
    if (discardConfirm) {
      discardTimerRef.current = setTimeout(() => {
        setDiscardConfirm(false)
      }, 3000)
    }
    return () => {
      if (discardTimerRef.current) clearTimeout(discardTimerRef.current)
    }
  }, [discardConfirm])

  const handleEditSaved = useCallback((original: string, edited: string) => {
    const entry = {
      platform: draft.platformId,
      project_id: projectName,
      original,
      edited,
      timestamp: new Date().toISOString(),
    }
    try {
      const existing = JSON.parse(localStorage.getItem('kontrol_voice_edits') ?? '[]')
      existing.push(entry)
      localStorage.setItem('kontrol_voice_edits', JSON.stringify(existing))
    } catch {}
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
  }, [draft.platformId, projectName])

  // Three-dot menu actions
  const handleSaveAsDraft = () => {
    setMenuOpen(false)
    try {
      const drafts = JSON.parse(localStorage.getItem('kontrol_drafts') ?? '[]')
      const idx = drafts.findIndex((d: { platformId: string }) => d.platformId === draft.platformId)
      const entry = {
        platformId: draft.platformId,
        content: draft.content,
        savedAt: new Date().toISOString(),
      }
      if (idx >= 0) drafts[idx] = entry
      else drafts.push(entry)
      localStorage.setItem('kontrol_drafts', JSON.stringify(drafts))
    } catch {}
    showToast('Draft saved')
  }

  const handleCopyToClipboard = () => {
    setMenuOpen(false)
    navigator.clipboard.writeText(draft.content).then(() => {
      showToast('Copied to clipboard', 2000)
    }).catch(() => {
      showToast('Failed to copy')
    })
  }

  const handleDiscardBatch = () => {
    if (!discardConfirm) {
      setDiscardConfirm(true)
      return
    }
    setMenuOpen(false)
    setDiscardConfirm(false)
    onDiscardBatch()
    showToast('Batch discarded')
  }

  const handleReportIssue = () => {
    setMenuOpen(false)
    showToast('Thanks for the feedback!')
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: desktop ? 'var(--radius-card)' : 'var(--radius-card) var(--radius-card) 0 0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flex: desktop ? 1 : 'none',
      position: 'relative',
    }}>
      {/* Three-dot menu button — positioned top-right */}
      <div
        ref={menuRef}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 110,
        }}
      >
        <button
          onClick={() => { setMenuOpen(o => !o); setDiscardConfirm(false) }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
            flexShrink: 0,
          }}
          aria-label="Card options"
        >
          &#8943;
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '4px 0',
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              minWidth: 180,
            }}
          >
            {/* Save as draft */}
            <button
              onClick={handleSaveAsDraft}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 36,
                padding: '0 16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              Save as draft
            </button>

            {/* Duplicate to clipboard */}
            <button
              onClick={handleCopyToClipboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 36,
                padding: '0 16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              Duplicate to clipboard
            </button>

            {/* Discard batch */}
            <button
              onClick={handleDiscardBatch}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 36,
                padding: '0 16px',
                background: 'none',
                border: 'none',
                color: '#FF4444',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              {discardConfirm ? 'Tap again to discard all' : 'Discard batch'}
            </button>

            {/* Report issue */}
            <button
              onClick={handleReportIssue}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 36,
                padding: '0 16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              Report issue
            </button>
          </div>
        )}
      </div>

      <CardHero platform={platform} draft={draft} desktop={desktop} onTypeChange={onTypeChange} />

      <ConfidenceIndicator platformId={platform.id} insights={insights} />

      {viewMode === 'edit' ? (
        <CardContent
          draft={draft}
          platform={platform}
          onContentChange={onContentChange}
          onTitleChange={onTitleChange}
          onEditSaved={handleEditSaved}
          originalContent={originalContentRef.current}
          projectId={projectId}
          onSubredditChange={onSubredditChange}
        />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <PreviewCard
            draft={draft}
            platform={platform}
            selectedPostType={draft.selectedPostType}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      )}

      {/* Edit / Preview toggle — always visible */}
      <div style={{ padding: '6px 14px 4px', display: 'flex' }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 999,
          padding: 3,
          gap: 2,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* EDIT pill */}
          <button
            onClick={() => setViewMode('edit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              background: viewMode === 'edit' ? 'var(--bg-raised)' : 'transparent',
              color: viewMode === 'edit' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: viewMode === 'edit' ? 700 : 500,
              letterSpacing: 0.3,
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              transition: 'background .15s, color .15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ opacity: viewMode === 'edit' ? 1 : 0.5 }}>
              <path d="M1.5 11.5l1-3.5 7-7a1.4 1.4 0 012 2l-7 7-3.5 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M9 2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Edit
          </button>

          {/* PREVIEW pill */}
          <button
            onClick={() => setViewMode('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              background: viewMode === 'preview' ? 'var(--bg-raised)' : 'transparent',
              color: viewMode === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: viewMode === 'preview' ? 700 : 500,
              letterSpacing: 0.3,
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              transition: 'background .15s, color .15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ opacity: viewMode === 'preview' ? 1 : 0.5 }}>
              <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="6.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            Preview
          </button>
        </div>
      </div>

      {flash && (
        <div style={{
          padding: '0 14px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'rgba(30,215,96,0.12)',
            border: '1px solid rgba(30,215,96,0.25)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: '#1ED760',
            letterSpacing: 0.2,
          }}>
            &#10003; saved to {platform.name} voice profile
          </span>
        </div>
      )}

      <ActionRow
        onApprove={onApprove}
        onRegenerate={onRegenerate}
        onSkip={onSkip}
        desktop={desktop}
      />
    </div>
  )
}
