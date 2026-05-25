import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '../components/shared/PageHeader'
import { Toggle } from '../components/shared/Toggle'
import { useToast } from '../components/shared/Toast'
import { redditApi } from '../api/reddit'
import { projectsApi } from '../api/projects'

// ─── Types ────────────────────────────────────────────────────────────────────

type SuggestionStatus = 'pending' | 'posted' | 'dismissed'
type FilterTab = 'all' | SuggestionStatus

interface Subreddit {
  id: string
  projectId: string
  projectName: string
  subreddit: string
  active: boolean
}

interface Suggestion {
  id: string
  projectName: string
  projectAccent: string
  subreddit: string
  postTitle: string
  postUrl: string
  suggestedComment: string
  status: SuggestionStatus
  createdAt: string
  postedAt?: string
  timeAgo?: string
  title?: string
  url?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PROJECT_ACCENTS: Record<string, string> = {
  'DaStu': 'linear-gradient(135deg, #FF4500, #FF6534)',
  'Sumo Slam': 'linear-gradient(135deg, #1B2838, #2A475E)',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const now = new Date('2026-05-23T10:00:00')
  const then = new Date(iso)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubredditRow({
  item, onToggle, onRemove,
}: {
  item: Subreddit
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <Toggle checked={item.active} onChange={() => onToggle(item.id)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block',
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          color: item.active ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
          {item.subreddit}
        </span>
      </div>
      {/* Project badge */}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '3px 8px',
        borderRadius: 999,
        background: 'var(--bg-raised)',
        fontSize: 11,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: PROJECT_ACCENTS[item.projectName] ?? 'var(--bg-active)',
          flexShrink: 0,
        }} />
        {item.projectName}
      </span>
      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        style={{
          width: 28, height: 28, borderRadius: 8,
          border: 'none',
          background: 'none',
          color: 'rgba(239,68,68,0.6)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-label="Remove subreddit"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

function SuggestionCard({
  suggestion, onPost, onDismiss,
}: {
  suggestion: Suggestion
  onPost: (id: string, editedText?: string) => void
  onDismiss: (id: string) => void
}) {
  const [showMore, setShowMore] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(suggestion.suggestedComment)

  const MAX_LINES_CHARS = 320
  const isLong = suggestion.suggestedComment.length > MAX_LINES_CHARS
  const displayComment = showMore ? suggestion.suggestedComment : suggestion.suggestedComment.slice(0, MAX_LINES_CHARS) + (isLong ? '…' : '')

  const isDismissed = suggestion.status === 'dismissed'
  const isPosted = suggestion.status === 'posted'
  const isPending = suggestion.status === 'pending'

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-card)',
      padding: 16,
      marginBottom: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      opacity: isDismissed ? 0.45 : 1,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {/* Project swatch */}
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: suggestion.projectAccent,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
          {suggestion.projectName}
        </span>
        {/* Subreddit */}
        <span style={{ fontSize: 12, color: '#FF6534', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {suggestion.subreddit}
        </span>
        {/* Timestamp */}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {timeAgo(suggestion.createdAt)}
        </span>
      </div>

      {/* Post title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12 }}>
        <p style={{
          fontSize: 14, fontWeight: 700,
          color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
          lineHeight: 1.4, margin: 0, flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {suggestion.postTitle}
        </p>
        <a
          href={suggestion.postUrl}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}
          aria-label="Open post"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M8 1h4v4M12 1L7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 }} />

      {/* Suggested comment label */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Suggested comment:
      </div>

      {!editing && (
        <>
          <p style={{
            fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
            lineHeight: 1.55, margin: 0, marginBottom: isLong ? 6 : 0,
          }}>
            {displayComment}
          </p>
          {isLong && (
            <button
              onClick={() => setShowMore(s => !s)}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer', padding: 0,
              }}
            >
              {showMore ? 'Show less' : 'Show more'}
            </button>
          )}
        </>
      )}

      {editing && (
        <div style={{ marginBottom: 10 }}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            style={{
              width: '100%',
              minHeight: 80,
              background: 'var(--bg-active)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Status badges */}
      {isPosted && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(30,215,96,0.12)', border: '1px solid rgba(30,215,96,0.3)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1ED760' }} />
          <span style={{ fontSize: 11, color: '#1ED760', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Posted</span>
        </div>
      )}
      {isDismissed && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Dismissed</span>
        </div>
      )}

      {/* Pending actions — normal view */}
      {isPending && !editing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            onClick={() => onPost(suggestion.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              background: '#1ED760',
              color: '#000',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Post Comment
          </button>
          <button
            onClick={() => { setEditing(true); setEditText(suggestion.suggestedComment) }}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Edit &amp; Post
          </button>
          <button
            onClick={() => onDismiss(suggestion.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'none',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Edit mode actions */}
      {isPending && editing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => { onPost(suggestion.id, editText); setEditing(false) }}
            style={{
              padding: '8px 20px', borderRadius: 999,
              background: '#1ED760', color: '#000', border: 'none',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}
          >
            Post
          </button>
          <button
            onClick={() => { setEditing(false); setEditText(suggestion.suggestedComment) }}
            style={{
              padding: '8px 18px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)', background: 'none',
              color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Suggestions Empty State ──────────────────────────────────────────────────

function SuggestionsEmpty() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', gap: 12,
    }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M18 10v8l5 3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        No suggestions yet
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textAlign: 'center', opacity: 0.6 }}>
        Monitor is checking every 4 hours
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'posted', label: 'Posted' },
  { key: 'dismissed', label: 'Dismissed' },
]

export function RedditPage() {
  const { showToast } = useToast()
  const [subreddits, setSubreddits] = useState<Subreddit[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [newSubreddit, setNewSubreddit] = useState('')
  const checkNowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null)

  // Load active project ID from API on mount
  useEffect(() => {
    projectsApi.list()
      .then(list => {
        const active = list.find(p => p.active)
        setActiveProjectId(active?.id ?? null)
        setActiveProjectName(active?.name ?? null)
      })
      .catch(() => {})
  }, [])

  // Fetch real suggestions from API when active project is known
  useEffect(() => {
    if (!activeProjectId) return
    // Find the project name for accent lookup
    const projectName = activeProjectName ?? ''
    redditApi.getSuggestions(activeProjectId)
      .then(apiSuggestions => {
        setSuggestions(apiSuggestions.map(s => ({
          id: s.id,
          projectName,
          projectAccent: PROJECT_ACCENTS[projectName] ?? 'var(--bg-active)',
          subreddit: s.subreddit,
          postTitle: s.redditPostTitle,
          postUrl: s.redditPostUrl,
          suggestedComment: s.suggestedComment,
          status: s.status,
          createdAt: new Date().toISOString(),
          postedAt: undefined,
        })))
      })
      .catch(() => { /* backend offline — empty state already shown */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId])

  const pendingCount = suggestions.filter(s => s.status === 'pending').length

  const filtered = filterTab === 'all'
    ? suggestions
    : suggestions.filter(s => s.status === filterTab)

  const handleToggleSub = (id: string) => {
    setSubreddits(ss => ss.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const handleRemoveSub = (id: string) => {
    setSubreddits(ss => ss.filter(s => s.id !== id))
  }

  const handleAddSub = () => {
    const val = newSubreddit.trim()
    if (!val) return
    const formatted = val.startsWith('r/') ? val : `r/${val}`
    setSubreddits(ss => [...ss, {
      id: `sr-${Date.now()}`,
      projectId: activeProjectId ?? '',
      projectName: activeProjectName ?? '',
      subreddit: formatted,
      active: true,
    }])
    setNewSubreddit('')
  }

  const handlePost = (id: string, editedText?: string) => {
    setSuggestions(ss => ss.map(s => s.id === id
      ? { ...s, status: 'posted' as const, postedAt: new Date().toISOString() }
      : s
    ))
    showToast('Comment posted!')
    // Fire and forget API call
    redditApi.postComment(id, editedText).catch(() => {})
  }

  const handleDismiss = (id: string) => {
    setSuggestions(ss => ss.map(s => s.id === id ? { ...s, status: 'dismissed' as const } : s))
    showToast('Dismissed')
    // Fire and forget API call
    redditApi.dismissSuggestion(id).catch(() => {})
  }

  const handleCheckNow = () => {
    showToast('Checking subreddits…')
    if (checkNowTimerRef.current) clearTimeout(checkNowTimerRef.current)
    checkNowTimerRef.current = setTimeout(() => {
      showToast('No new posts found')
    }, 1500)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PageHeader title="Reddit" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px calc(72px + env(safe-area-inset-bottom))' }}>

        {/* ── Section 1: Monitored Subreddits ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              Monitored Subreddits
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Last checked: 2 hours ago
              </span>
              <button
                onClick={handleCheckNow}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', padding: 0,
                }}
              >
                Check now
              </button>
            </span>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-card)',
            padding: '0 14px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            {subreddits.map(item => (
              <SubredditRow
                key={item.id}
                item={item}
                onToggle={handleToggleSub}
                onRemove={handleRemoveSub}
              />
            ))}

            {subreddits.length === 0 && (
              <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                No subreddits monitored
              </div>
            )}

            {/* Add subreddit row */}
            <div style={{
              display: 'flex', gap: 8, paddingTop: 12, paddingBottom: 14,
              borderTop: subreddits.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <input
                type="text"
                placeholder="r/subreddit"
                value={newSubreddit}
                onChange={e => setNewSubreddit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSub()}
                style={{
                  flex: 1,
                  background: 'var(--bg-raised)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddSub}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 2: Suggestions ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              Suggestions
            </span>
            {pendingCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 20, borderRadius: 999, padding: '0 6px',
                background: 'var(--accent)', color: '#fff',
                fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)',
              }}>
                {pendingCount}
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {FILTER_TABS.map(tab => {
              const active = filterTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Suggestion cards */}
          {filtered.length === 0 ? (
            <SuggestionsEmpty />
          ) : (
            filtered.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onPost={(id, editedText) => handlePost(id, editedText)}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// FRONTEND-AGENT: RedditPage complete (Task A + Task E wired)
