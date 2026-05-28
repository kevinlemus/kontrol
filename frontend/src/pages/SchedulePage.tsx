import { useState, Fragment, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/shared/PageHeader'
import { useToast } from '../components/shared/Toast'
import { performanceApi } from '../api/performance'
import { projectsApi } from '../api/projects'
import { WhyOverlay } from '../components/shared/WhyOverlay'
import type { SmartScheduleTimingDto } from '../api/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformKey = 'IG' | 'TT' | 'LI' | 'RD' | 'X' | 'FB' | 'YT' | 'ST' | 'IT' | 'GJ'

interface ScheduledPost {
  id: string
  projectName: string
  projectAccent: string
  platforms: PlatformKey[]
  scheduledAt: string
  content: string
  status: 'pending' | 'published' | 'cancelled'
  source: 'manual' | 'smart'
  ai_reasoning?: string | null
}

interface SmartBatchPost {
  platformId: string
  platformName: string
  platformGradient: string
  scheduledAt: string
  content: string
}

interface SmartBatch {
  id: string
  createdAt: string
  projectName: string
  posts: SmartBatchPost[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_GRADIENTS: Record<PlatformKey, string> = {
  IG: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
  TT: 'linear-gradient(135deg, #010101, #69C9D0)',
  LI: 'linear-gradient(135deg, #0A66C2, #0077B5)',
  RD: 'linear-gradient(135deg, #FF4500, #FF6534)',
  X:  'linear-gradient(135deg, #1a1a1a, #333333)',
  FB: 'linear-gradient(135deg, #1877F2, #0C5FCF)',
  YT: 'linear-gradient(135deg, #FF0000, #CC0000)',
  ST: 'linear-gradient(135deg, #1B2838, #2A475E)',
  IT: 'linear-gradient(135deg, #FA5C5C, #E63946)',
  GJ: 'linear-gradient(135deg, #2F7F3E, #45B069)',
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getCurrentWeek(): { label: string; date: number; iso: string }[] {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1))
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      label,
      date: d.getDate(),
      iso: toLocalISO(d),
    }
  })
}

const WEEK_DAYS = getCurrentWeek()
const TODAY_ISO = toLocalISO(new Date())

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function groupByDate(posts: ScheduledPost[]): Map<string, ScheduledPost[]> {
  const map = new Map<string, ScheduledPost[]>()
  for (const p of posts) {
    if (!p?.scheduledAt) continue
    const key = p.scheduledAt.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return map
}

// ─── Platform chip ────────────────────────────────────────────────────────────

function PlatformChip({ pk }: { pk: PlatformKey }) {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: 999,
      background: PLATFORM_GRADIENTS[pk],
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff',
      flexShrink: 0,
    }}>
      {pk}
    </span>
  )
}

// ─── Scheduled Post Card ──────────────────────────────────────────────────────

function ScheduledCard({
  post, onRemove,
}: {
  post: ScheduledPost
  onRemove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content ?? '')
  const [editingTime, setEditingTime] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  const { showToast } = useToast()

  const tDate = new Date(post.scheduledAt)
  const [editTimeValue, setEditTimeValue] = useState(
    `${String(tDate.getHours()).padStart(2, '0')}:${String(tDate.getMinutes()).padStart(2, '0')}`
  )

  const safeContent = post.content ?? ''
  const preview = safeContent.length > 80
    ? safeContent.slice(0, 80) + '…'
    : safeContent

  const handleCancelClick = () => {
    if (!cancelConfirm) {
      setCancelConfirm(true)
      setTimeout(() => setCancelConfirm(false), 3000)
      return
    }
    onRemove(post.id)
  }

  return (
    <div
      onClick={() => !editing && setExpanded(e => !e)}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-card)',
        marginBottom: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width: 4, flexShrink: 0,
        background: post.projectAccent,
        borderRadius: '16px 0 0 16px',
      }} />

      <div style={{ flex: 1, padding: '14px 14px 14px 12px' }}>
        {/* Top row: project dot + name + platforms + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: post.projectAccent, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
            {post.projectName}
          </span>
          <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
            {post.platforms.map(pk => <PlatformChip key={pk} pk={pk} />)}
          </div>
          {/* Clock + smart badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
            {post.source === 'smart' && (
              <>
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 999,
                  padding: '1px 6px',
                  letterSpacing: 0.3,
                }}>
                  SMART
                </span>
                <button
                  onClick={e => { e.stopPropagation(); setShowWhy(true) }}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 999,
                    padding: '1px 6px',
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    letterSpacing: 0.3,
                  }}
                >
                  Why?
                </button>
              </>
            )}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.45 }}>
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {new Date(post.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        {/* Content preview / full */}
        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {expanded ? safeContent : preview}
        </p>

        {/* Expanded detail panel */}
        {expanded && !editing && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              marginTop: 10,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Platforms row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 64, flexShrink: 0 }}>Platforms</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {post.platforms.map(pk => <PlatformChip key={pk} pk={pk} />)}
              </div>
            </div>

            {/* Scheduled time row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 64, flexShrink: 0 }}>Scheduled</span>
              {!editingTime ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(post.scheduledAt).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingTime(true) }}
                    style={{
                      background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, padding: '2px 8px',
                      color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                      fontSize: 10, cursor: 'pointer',
                    }}
                  >
                    Edit time
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <input
                    type="time"
                    value={editTimeValue}
                    onChange={e => setEditTimeValue(e.target.value)}
                    style={{
                      background: 'var(--bg-raised)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      padding: '4px 10px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => { setEditingTime(false); showToast('Schedule time updated') }}
                    style={{
                      background: 'var(--accent)', color: '#fff', border: 'none',
                      borderRadius: 6, padding: '4px 10px',
                      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingTime(false) }}
                    style={{
                      background: 'none', color: 'var(--text-muted)', border: 'none',
                      fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Source badge row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 64, flexShrink: 0 }}>Source</span>
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: post.source === 'smart' ? 'var(--accent)' : 'var(--text-muted)',
                background: post.source === 'smart' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${post.source === 'smart' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 999, padding: '2px 8px', letterSpacing: 0.3,
              }}>
                {post.source === 'smart' ? 'Smart Schedule' : 'Manual'}
              </span>
            </div>
          </div>
        )}

        {/* Expanded actions */}
        {expanded && !editing && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', gap: 8, marginTop: 14 }}
          >
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'none',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={handleCancelClick}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-button)',
                border: cancelConfirm ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(239,68,68,0.35)',
                background: cancelConfirm ? 'rgba(239,68,68,0.1)' : 'none',
                color: '#EF4444',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background .15s, border-color .15s',
              }}
            >
              {cancelConfirm ? 'Yes, cancel it' : 'Cancel post'}
            </button>
          </div>
        )}

        {/* Edit mode */}
        {expanded && editing && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ marginTop: 12 }}
          >
            <textarea
              rows={4}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-raised)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => { setEditing(false); showToast('Post updated') }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditContent(post.content ?? '') }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'none',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
      {showWhy && (
        <WhyOverlay
          reasoning={post.ai_reasoning}
          onClose={() => setShowWhy(false)}
        />
      )}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onGoToCompose }: { onGoToCompose: () => void }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      {/* Calendar icon */}
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="6" y="10" width="36" height="32" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
        <path d="M6 18h36" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
        <rect x="14" y="6" width="4" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
        <rect x="30" y="6" width="4" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
        <circle cx="24" cy="30" r="3" fill="rgba(255,255,255,0.2)"/>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
          Nothing scheduled yet
        </span>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.5, maxWidth: 260, display: 'block', margin: '0 auto' }}>
          Generate posts in Compose, then schedule them to publish across your platforms automatically.
        </span>
      </div>
      <button
        onClick={onGoToCompose}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 'var(--radius-button)',
          padding: '12px 24px',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        Go to Compose →
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


// ─── Page ─────────────────────────────────────────────────────────────────────

export function SchedulePage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [scheduleTiming, setScheduleTiming] = useState<SmartScheduleTimingDto | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [smartBatches, setSmartBatches] = useState<SmartBatch[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('kontrol_smart_schedule') ?? '[]')
      return Array.isArray(parsed) ? parsed.filter((b): b is SmartBatch => b != null) : []
    } catch { return [] }
  })

  // Load active project ID from API
  useEffect(() => {
    projectsApi.list()
      .then(list => {
        const active = list.find(p => p.active)
        setActiveProjectId(active?.id ?? null)
      })
      .catch(() => {})
  }, [])

  const handleRemove = (id: string) => {
    setPosts(ps => ps.filter(p => p.id !== id))
  }

  const displayedPosts = selectedDay
    ? posts.filter(p => p?.scheduledAt?.startsWith(selectedDay))
    : posts.filter(p => p != null)

  const grouped = groupByDate(displayedPosts)
  const sortedDateKeys = Array.from(grouped.keys()).sort()

  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}
      onClick={() => setShowLegend(false)}
    >
      <PageHeader
        title="Schedule"
        rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Info button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={e => {
                  e.stopPropagation()
                  const nextOpen = !showLegend
                  setShowLegend(nextOpen)
                  if (nextOpen) {
                    const enabledPlatformIds = posts
                      .filter(p => p?.platforms)
                      .flatMap(p => p.platforms)
                      .filter((v, i, a) => v != null && a.indexOf(v) === i)
                    if (activeProjectId) {
                      performanceApi.getScheduleTiming(activeProjectId, enabledPlatformIds)
                        .then(setScheduleTiming)
                        .catch(() => {}) // keep null on failure, fall back to hardcoded
                    }
                  }
                }}
                style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: showLegend ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: showLegend ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 700,
                  transition: 'background .15s, color .15s',
                  flexShrink: 0,
                }}
                aria-label="Optimal post times"
              >
                i
              </button>
              {/* Legend dropdown */}
              {showLegend && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 36,
                    right: 0,
                    width: 240,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 14,
                    zIndex: 50,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {scheduleTiming && (
                    <div style={{
                      padding: '6px 0 10px',
                      fontSize: 11.5, fontFamily: 'var(--font-mono)',
                      color: scheduleTiming.usingPersonalizedData ? '#1ED760' : 'var(--text-muted)',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: 10,
                    }}>
                      {scheduleTiming.dataMessage}
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                    Optimal windows
                  </div>
                  {[
                    ['Instagram', '11am, 7pm'],
                    ['TikTok', '7pm – 9pm'],
                    ['LinkedIn', 'Tue–Thu 9am'],
                    ['Reddit', '9am, 8pm'],
                    ['X', '8am, 4pm'],
                    ['Facebook', '1pm – 3pm'],
                    ['YouTube', '3pm – 5pm'],
                    ['Steam / itch / GJ', '+30min stagger'],
                  ].map(([platform, window]) => (
                    <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{platform}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{window}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                    Smart Schedule picks the next available slot past the current time.
                  </div>
                </div>
              )}
            </div>

            {/* Add Post button */}
            <button
              onClick={() => navigate('/compose')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Add Post
            </button>
          </div>
        }
      />

      {/* Smart Schedule batches timeline */}
      {smartBatches.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          {smartBatches.filter(batch => batch?.posts).map((batch, batchIdx) => (
            <div key={batch.id} style={{ marginBottom: batchIdx < smartBatches.length - 1 ? 16 : 0 }}>
              {/* Batch header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase' as const,
                    letterSpacing: 0.8,
                  }}>
                    Smart Schedule — {batch.projectName}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(30,215,96,0.1)',
                    border: '1px solid rgba(30,215,96,0.25)',
                    fontSize: 10,
                    color: '#1ED760',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}>
                    {batch.posts.length} posts
                  </span>
                </div>
                <button
                  onClick={() => {
                    const updated = smartBatches.filter(b => b.id !== batch.id)
                    setSmartBatches(updated)
                    localStorage.setItem('kontrol_smart_schedule', JSON.stringify(updated))
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '0 4px',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Horizontal timeline */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
                  {batch.posts.filter(post => post?.scheduledAt).map((post, i) => {
                    const t = new Date(post.scheduledAt)
                    const fallbackLabel = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                    const isToday = t.toDateString() === new Date().toDateString()
                    const timingEntry = scheduleTiming?.timings[post.platformId]
                    const displayLabel = timingEntry
                      ? `${timingEntry.personalized ? '\u{1F4CA} ' : ''}${timingEntry.label}`
                      : (isToday ? fallbackLabel : `tmrw ${fallbackLabel}`)
                    return (
                      <Fragment key={post.platformId + i}>
                        {i > 0 && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '0 6px',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                          }}>
                            →
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: post.platformGradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#fff',
                            fontFamily: 'var(--font-body)',
                          }}>
                            {post.platformId}
                          </div>
                          <span style={{
                            fontSize: 9.5,
                            color: timingEntry?.personalized ? '#1ED760' : (isToday ? 'var(--text-secondary)' : 'var(--accent)'),
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                          }}>
                            {displayLabel}
                          </span>
                        </div>
                      </Fragment>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Week strip */}
      <div style={{
        display: 'flex',
        padding: '12px 16px',
        gap: 4,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        {WEEK_DAYS.map(day => {
          const isToday = day.iso === TODAY_ISO
          const hasPost = posts.some(p => p?.scheduledAt?.startsWith(day.iso))
          const isSelected = selectedDay === day.iso
          return (
            <button
              key={day.iso}
              onClick={() => setSelectedDay(isSelected ? null : day.iso)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 10,
                border: 'none',
                background: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: isToday ? 'var(--accent)' : isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {day.label}
              </span>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isToday ? 'var(--accent)' : isSelected ? 'rgba(59,130,246,0.2)' : 'transparent',
                fontSize: 13,
                fontWeight: isToday ? 800 : 600,
                fontFamily: 'var(--font-body)',
                color: isToday ? '#fff' : isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {day.date}
              </span>
              {/* Post indicator dot */}
              {hasPost && (
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: isToday ? '#fff' : 'var(--accent)',
                  opacity: 0.8,
                }} />
              )}
              {!hasPost && <span style={{ width: 5, height: 5 }} />}
            </button>
          )
        })}
      </div>

      {/* Post list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px calc(72px + env(safe-area-inset-bottom))' }}>
        {selectedDay && displayedPosts.length === 0 && (
          <EmptyState onGoToCompose={() => navigate('/compose')} />
        )}
        {!selectedDay && posts.length === 0 && smartBatches.length === 0 && (
          <EmptyState onGoToCompose={() => navigate('/compose')} />
        )}

        {sortedDateKeys.map(dateKey => (
          <div key={dateKey} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}>
              {formatDate(dateKey)}
            </div>
            {grouped.get(dateKey)!.map(post => (
              <ScheduledCard key={post.id} post={post} onRemove={handleRemove} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// FRONTEND-AGENT: SchedulePage complete
