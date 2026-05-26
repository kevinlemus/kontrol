import { useState, useEffect, useRef } from 'react'
import { redditApi } from '../../api/reddit'
import type { ApiSubredditMonitor } from '../../api/types'

interface SubredditSelectorProps {
  selectedSubreddit: string | undefined
  reasoning: string | undefined
  projectId: string | null
  onSelect: (subreddit: string) => void
}

export function SubredditSelector({ selectedSubreddit, reasoning, projectId, onSelect }: SubredditSelectorProps) {
  const [monitors, setMonitors] = useState<ApiSubredditMonitor[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch monitors from API when component mounts or projectId changes
  useEffect(() => {
    if (!projectId) return
    redditApi.getMonitors(projectId)
      .then(setMonitors)
      .catch(() => {
        // API unavailable — leave monitors empty; user can add subreddits in the Reddit tab
        setMonitors([])
      })
  }, [projectId])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const displayName = selectedSubreddit ? `r/${selectedSubreddit}` : 'r/— not selected'

  return (
    <div style={{ padding: '8px 14px 4px' }}>
      {/* Subreddit badge + reasoning row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        {/* Badge */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(255,69,0,0.12)',
          border: '1px solid rgba(255,69,0,0.3)',
          borderRadius: 999,
          padding: '3px 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          color: '#FF6B35',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {displayName}
        </span>

        {/* Reasoning */}
        {reasoning && (
          <span style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.4,
            paddingTop: 3,
          }}>
            {reasoning}
          </span>
        )}
      </div>

      {/* Change subreddit button + dropdown */}
      <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setDropdownOpen(o => !o)}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '4px 10px',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Change subreddit
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '4px 0',
            minWidth: 220,
            zIndex: 120,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            {monitors.length === 0 && (
              <div style={{
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
              }}>
                No monitored subreddits.<br/>Add some in the Reddit tab.
              </div>
            )}
            {monitors.map(m => {
              const isCurrent = m.subreddit === selectedSubreddit
              const label = `r/${m.subreddit}`
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (!m.coolingDown) {
                      onSelect(m.subreddit)
                      setDropdownOpen(false)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 14px',
                    background: isCurrent ? 'rgba(255,255,255,0.05)' : 'none',
                    border: 'none',
                    cursor: m.coolingDown ? 'default' : 'pointer',
                    textAlign: 'left',
                    opacity: m.coolingDown ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { if (!m.coolingDown) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'none' }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? '#FF6B35' : 'var(--text-primary)',
                  }}>
                    {label}
                  </span>
                  {m.coolingDown ? (
                    <span style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 6,
                      padding: '2px 6px',
                    }}>
                      cooldown — {m.hoursUntilEligible}h left
                    </span>
                  ) : isCurrent ? (
                    <span style={{ fontSize: 10, color: '#FF6B35', fontFamily: 'var(--font-mono)' }}>
                      ✓ selected
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// FRONTEND-AGENT: SubredditSelector complete
