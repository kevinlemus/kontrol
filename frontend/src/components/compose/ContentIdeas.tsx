import { useState, useEffect, useCallback, useRef } from 'react'
import { strategyApi } from '../../api/strategyApi'
import type { StrategySuggestion } from '../../api/strategyApi'

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

export function ContentIdeas({ projectId, onSelectSuggestion }: ContentIdeasProps) {
  const [expanded, setExpanded] = useState(false)
  const [suggestions, setSuggestions] = useState<StrategySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const lastProjectId = useRef<string | null>(null)

  const loadSuggestions = useCallback(async (pid: string) => {
    setLoading(true)
    try {
      const data = await strategyApi.suggestions(pid)
      setSuggestions(data ?? [])
      setLoaded(true)
    } catch {
      setSuggestions([])
      setLoaded(true)
    }
    setLoading(false)
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
    }
  }, [projectId])

  const handleRefresh = () => {
    if (!projectId) return
    setLoaded(false)
    void loadSuggestions(projectId)
  }

  return (
    <div style={{ margin: '0 14px 6px', flexShrink: 0 }}>
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
        </div>
      )}
    </div>
  )
}

// FRONTEND-AGENT: ContentIdeas complete
