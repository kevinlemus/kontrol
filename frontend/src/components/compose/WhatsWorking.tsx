import { useState } from 'react'
import type { PerformanceInsightDto } from '../../api/types'

interface WhatsWorkingProps {
  insights: PerformanceInsightDto[] | null
  selectedPlatforms: string[]
}

export function WhatsWorking({ insights, selectedPlatforms }: WhatsWorkingProps) {
  const [expanded, setExpanded] = useState(false)

  // Only show when we have meaningful data (hasEnoughData on at least one platform)
  const usefulInsights = (insights ?? []).filter(
    i => i.hasEnoughData && selectedPlatforms.includes(i.platform)
  )

  if (usefulInsights.length === 0) return null

  return (
    <div style={{ padding: '0 14px 6px', flexShrink: 0 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          width: '100%',
        }}
      >
        <span style={{ fontSize: 13 }}>💡</span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-muted)',
        }}>
          What&apos;s working ({usefulInsights.length} platform{usefulInsights.length > 1 ? 's' : ''})
        </span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            marginLeft: 'auto',
            opacity: 0.4,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform .15s',
          }}
        >
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {usefulInsights.map(insight => (
            <div
              key={insight.platform}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: 0.5,
                }}>
                  {insight.platform}
                </span>
                {insight.bestHourLabel && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    · Best: {insight.bestHourLabel}{insight.bestDayLabel ? `, ${insight.bestDayLabel}` : ''}
                  </span>
                )}
              </div>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {insight.insightSummary}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// FRONTEND-AGENT: WhatsWorking complete
