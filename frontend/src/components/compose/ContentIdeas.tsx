import { useState, useEffect, useCallback, useRef } from 'react'
import { strategyApi } from '../../api/strategyApi'
import type { StrategySuggestion, ContentMixData, DayPlan, StrategyResponse } from '../../api/strategyApi'

interface ContentIdeasProps {
  projectId: string | null
  onSelectSuggestion: (prompt: string) => void
}

const URGENCY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: 'rgba(255,255,255,0.3)',
}

const PLATFORM_COLORS: Record<string, string> = {
  IG: '#E1306C',
  TT: '#69C9D0',
  LI: '#0077B5',
  RD: '#FF4500',
  X: '#888888',
  FB: '#1877F2',
  YT: '#FF0000',
  ST: '#2A475E',
  IT: '#FA5C5C',
  GJ: '#45B069',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  before_after: 'Before/After',
  tip: 'Tips',
  promotional: 'Promo',
  testimonial: 'Testimonial',
  behind_scenes: 'Behind-Scenes',
  announcement: 'Announcement',
  engagement: 'Engagement',
  other: 'Other',
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  before_after: '#8B5CF6',
  tip: '#3B82F6',
  promotional: '#EF4444',
  testimonial: '#1ED760',
  behind_scenes: '#F59E0B',
  announcement: '#06B6D4',
  engagement: '#EC4899',
  other: 'rgba(255,255,255,0.2)',
}

function SkeletonCard() {
  return (
    <div style={{
      width: 280,
      minHeight: 120,
      background: '#181818',
      borderRadius: 12,
      padding: '14px 16px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.07)', width: '60%' }} />
      <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: '40%' }} />
      <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: '80%', marginTop: 4 }} />
      <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: '70%' }} />
    </div>
  )
}

function ContentMixBar({ mixData }: { mixData: ContentMixData }) {
  const percents = mixData.contentMixPercents ?? {}
  const activeTypes = Object.entries(percents).filter(([, pct]) => pct > 0)

  // Repetition warning: last 3 all same type
  const recentTypes = mixData.recentTypes ?? []
  const allSame = recentTypes.length === 3 && recentTypes.every(t => t === recentTypes[0])
  const repeatedType = allSame ? recentTypes[0] : null

  return (
    <div style={{
      background: '#181818',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    }}>
      {/* Title row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}>
          Content mix — last 30 days
        </span>
        {mixData.mixBalanced ? (
          <span style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#1ED760',
            background: 'rgba(30,215,96,0.12)',
            border: '1px solid rgba(30,215,96,0.3)',
            padding: '2px 8px',
            borderRadius: 999,
          }}>
            ✓ Balanced
          </span>
        ) : mixData.mixWarning ? (
          <span style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#F59E0B',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            padding: '2px 8px',
            borderRadius: 999,
          }}>
            ⚠ Warning
          </span>
        ) : null}
      </div>

      {/* Mini bar */}
      <div style={{
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        marginBottom: 8,
      }}>
        {activeTypes.map(([type, pct]) => (
          <div
            key={type}
            style={{
              width: `${pct}%`,
              background: CONTENT_TYPE_COLORS[type] ?? 'rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Legend row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px 8px',
        marginBottom: 8,
      }}>
        {activeTypes.map(([type, pct]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: CONTENT_TYPE_COLORS[type] ?? 'rgba(255,255,255,0.2)',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              {CONTENT_TYPE_LABELS[type] ?? type} {Math.round(pct)}%
            </span>
          </div>
        ))}
      </div>

      {/* Mix warning */}
      {mixData.mixWarning && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 6,
          padding: '6px 10px',
          marginBottom: 6,
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          color: '#F59E0B',
        }}>
          ⚠ {mixData.mixWarning}
        </div>
      )}

      {/* Repetition warning */}
      {repeatedType && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 6,
          padding: '6px 10px',
          marginBottom: 6,
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          color: '#F59E0B',
        }}>
          🔁 Your last 3 posts were all {CONTENT_TYPE_LABELS[repeatedType] ?? repeatedType}s — try mixing it up
        </div>
      )}

      {/* Total posts note */}
      <div style={{
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.25)',
        marginTop: 2,
      }}>
        Based on {mixData.totalPostsLast30Days} posts in the last 30 days
      </div>
    </div>
  )
}

function WeeklyPlanSection({
  projectId,
  weeklyPlan,
  weeklyPlanLoading,
  showWeeklyPlan,
  onToggle,
  onLoadPlan,
  onSelectSuggestion,
}: {
  projectId: string | null
  weeklyPlan: DayPlan[] | null
  weeklyPlanLoading: boolean
  showWeeklyPlan: boolean
  onToggle: () => void
  onLoadPlan: () => void
  onSelectSuggestion: (prompt: string) => void
}) {
  return (
    <div style={{ padding: '12px 14px 0' }}>
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          padding: '4px 0',
          cursor: 'pointer',
          marginBottom: showWeeklyPlan ? 10 : 0,
        }}
      >
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'var(--font-body)',
        }}>
          📅 This Week&apos;s Plan
        </span>
        <span style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'var(--font-mono)',
        }}>
          {showWeeklyPlan ? '▼' : '▶'}
        </span>
      </button>

      {showWeeklyPlan && (
        <div>
          {weeklyPlan === null && !weeklyPlanLoading && (
            <button
              onClick={onLoadPlan}
              disabled={!projectId}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 13,
                cursor: projectId ? 'pointer' : 'not-allowed',
                opacity: projectId ? 1 : 0.5,
                marginBottom: 8,
              }}
            >
              Generate This Week&apos;s Plan
            </button>
          )}

          {weeklyPlanLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 0',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
            }}>
              <span style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(59,130,246,0.3)',
                borderTopColor: '#3B82F6',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              Generating plan...
            </div>
          )}

          {weeklyPlan !== null && weeklyPlan.length > 0 && (
            <>
              {weeklyPlan.map((day) => (
                <div
                  key={day.dayIndex}
                  style={{
                    background: '#282828',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  {/* Left: day + platform */}
                  <div style={{ minWidth: 72, flexShrink: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: 'var(--font-body)',
                      marginBottom: 4,
                    }}>
                      {day.dayLabel}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: PLATFORM_COLORS[day.platform] ?? '#3B82F6',
                      color: '#fff',
                      fontSize: 8,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      letterSpacing: 0.5,
                    }}>
                      {day.platform}
                    </span>
                  </div>

                  {/* Right: type + topic + button */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: CONTENT_TYPE_COLORS[day.contentType] ?? 'rgba(255,255,255,0.2)',
                        color: day.contentType === 'other' ? 'rgba(255,255,255,0.6)' : '#fff',
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        letterSpacing: 0.3,
                      }}>
                        {CONTENT_TYPE_LABELS[day.contentType] ?? day.contentType}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: '#fff',
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.4,
                      marginBottom: 8,
                      wordBreak: 'break-word',
                    }}>
                      {day.topic}
                    </div>
                    <button
                      onClick={() => onSelectSuggestion(day.suggestedPrompt)}
                      style={{
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 6,
                        padding: '4px 10px',
                        color: '#3B82F6',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Generate →
                    </button>
                  </div>
                </div>
              ))}

              {/* Generate All button */}
              <button
                onClick={() => {
                  if (weeklyPlan.length > 0) {
                    onSelectSuggestion(weeklyPlan[0].suggestedPrompt)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 4,
                }}
              >
                Generate All 7 Posts
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function ContentIdeas({ projectId, onSelectSuggestion }: ContentIdeasProps) {
  const [expanded, setExpanded] = useState(false)
  const [suggestions, setSuggestions] = useState<StrategySuggestion[]>([])
  const [mixData, setMixData] = useState<ContentMixData | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null)
  const [weeklyPlanLoading, setWeeklyPlanLoading] = useState(false)
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const lastProjectId = useRef<string | null>(null)

  const loadSuggestions = useCallback(async (pid: string) => {
    setLoading(true)
    try {
      const raw = await strategyApi.suggestions(pid)
      // Handle both enriched StrategyResponse and legacy StrategySuggestion[]
      if (Array.isArray(raw)) {
        setSuggestions(raw ?? [])
        setMixData(null)
      } else {
        const resp = raw as StrategyResponse
        setSuggestions(resp.suggestions ?? [])
        setMixData({
          contentMixCounts: resp.contentMixCounts ?? {},
          contentMixPercents: resp.contentMixPercents ?? {},
          recentTypes: resp.recentTypes ?? [],
          totalPostsLast30Days: resp.totalPostsLast30Days ?? 0,
          mixWarning: resp.mixWarning ?? null,
          mixBalanced: resp.mixBalanced ?? false,
        })
      }
      setLoaded(true)
    } catch {
      setSuggestions([])
      setMixData(null)
      setLoaded(true)
    }
    setLoading(false)
  }, [])

  const loadWeeklyPlan = useCallback(async (pid: string) => {
    setWeeklyPlanLoading(true)
    try {
      const resp = await strategyApi.fetchWeeklyPlan(pid)
      setWeeklyPlan(resp?.days ?? [])
    } catch {
      setWeeklyPlan([])
    }
    setWeeklyPlanLoading(false)
  }, [])

  useEffect(() => {
    if (expanded && projectId && (projectId !== lastProjectId.current || !loaded)) {
      lastProjectId.current = projectId
      void loadSuggestions(projectId)
    }
  }, [expanded, projectId, loaded, loadSuggestions])

  // Reset when project changes
  useEffect(() => {
    if (projectId !== lastProjectId.current) {
      setLoaded(false)
      setSuggestions([])
      setMixData(null)
      setWeeklyPlan(null)
      setShowWeeklyPlan(false)
    }
  }, [projectId])

  const handleRefresh = () => {
    if (!projectId) return
    setLoaded(false)
    void loadSuggestions(projectId)
  }

  const handleLoadWeeklyPlan = () => {
    if (!projectId) return
    void loadWeeklyPlan(projectId)
  }

  return (
    <div style={{ margin: '0 14px 6px', flexShrink: 0 }}>
      {/* Keyframe style injection for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: expanded ? '10px 10px 0 0' : 10,
          padding: '10px 14px',
          cursor: 'pointer',
          transition: 'background .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>&#128161;</span>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}>
            Content Ideas
          </span>
          {loaded && suggestions.length > 0 && (
            <span style={{
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: '#3B82F6',
              color: '#fff',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
            }}>
              {suggestions.length}
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
            opacity: 0.5,
          }}
        >
          <path d="M3 5.5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: '12px 0 12px',
        }}>
          {/* Content mix bar (above suggestion cards) */}
          {mixData !== null && (
            <div style={{ padding: '0 14px' }}>
              <ContentMixBar mixData={mixData} />
            </div>
          )}

          {/* Horizontal scroll row */}
          <div style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            padding: '0 14px',
            paddingBottom: 4,
          }}>
            {loading ? (
              [1, 2, 3].map(i => <SkeletonCard key={i} />)
            ) : suggestions.length === 0 ? (
              <div style={{
                padding: '16px 0',
                fontSize: 13,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
              }}>
                {projectId ? 'No suggestions yet. Generate some posts first.' : 'Select a project to see ideas.'}
              </div>
            ) : (
              suggestions.map(sug => (
                <div
                  key={sug.id}
                  onClick={() => onSelectSuggestion(sug.suggestedPrompt)}
                  style={{
                    width: 280,
                    minHeight: 120,
                    background: '#181818',
                    borderRadius: 12,
                    padding: '14px 16px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    transition: 'transform .12s, box-shadow .12s',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  {/* Title + urgency dot */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: URGENCY_COLORS[sug.urgency] ?? 'rgba(255,255,255,0.3)',
                      flexShrink: 0,
                      marginTop: 4,
                    }} />
                    <span style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.3,
                    }}>
                      {sug.title}
                    </span>
                  </div>

                  {/* Platform chip */}
                  <span style={{
                    alignSelf: 'flex-start',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: PLATFORM_COLORS[sug.platform] ?? '#3B82F6',
                    color: '#fff',
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    letterSpacing: 0.5,
                  }}>
                    {sug.platform}
                  </span>

                  {/* Reason */}
                  <span style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.5,
                    flex: 1,
                  }}>
                    {sug.reason}
                  </span>

                  {/* Engagement indicator */}
                  {sug.estimatedEngagement === 'above_average' && (
                    <span style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: '#1ED760',
                    }}>
                      ↑ Expected above-average engagement
                    </span>
                  )}
                  {sug.estimatedEngagement === 'below_average' && (
                    <span style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: '#EF4444',
                    }}>
                      ↓ Expected below-average engagement
                    </span>
                  )}

                  {/* Content type tag */}
                  <span style={{
                    alignSelf: 'flex-start',
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {sug.contentType}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Refresh button */}
          <div style={{ padding: '8px 14px 0' }}>
            <button
              onClick={handleRefresh}
              disabled={loading || !projectId}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '6px 14px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                cursor: loading || !projectId ? 'not-allowed' : 'pointer',
                opacity: loading || !projectId ? 0.4 : 1,
                transition: 'opacity .15s',
              }}
            >
              {loading ? 'Loading...' : 'Refresh Ideas'}
            </button>
          </div>

          {/* Weekly plan section */}
          <WeeklyPlanSection
            projectId={projectId}
            weeklyPlan={weeklyPlan}
            weeklyPlanLoading={weeklyPlanLoading}
            showWeeklyPlan={showWeeklyPlan}
            onToggle={() => setShowWeeklyPlan(s => !s)}
            onLoadPlan={handleLoadWeeklyPlan}
            onSelectSuggestion={onSelectSuggestion}
          />
        </div>
      )}
    </div>
  )
}

// FRONTEND-AGENT: ContentIdeas complete
