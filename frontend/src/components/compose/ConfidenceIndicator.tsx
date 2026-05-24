import React, { useState } from 'react'
import type { PerformanceInsightDto } from '../../api/types'

interface ConfidenceIndicatorProps {
  platformId: string
  insights: PerformanceInsightDto[] | null | undefined
}

export function ConfidenceIndicator({ platformId, insights }: ConfidenceIndicatorProps) {
  const [expanded, setExpanded] = useState(false)
  const insight = insights?.find(i => i.platform === platformId) ?? null

  const learningChip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 999,
    fontSize: 10.5, fontFamily: 'var(--font-mono)',
    background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
  }

  const dataChip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 999,
    fontSize: 10.5, fontFamily: 'var(--font-mono)',
    background: 'rgba(30,215,96,0.1)',
    border: '1px solid rgba(30,215,96,0.2)',
    color: '#1ED760',
  }

  if (!insight) {
    return (
      <div style={{ padding: '0 14px 8px' }}>
        <span style={learningChip}>Learning...</span>
      </div>
    )
  }

  const chipStyle = insight.hasEnoughData ? dataChip : learningChip

  return (
    <div style={{ padding: '0 14px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={chipStyle}>{insight.confidenceLabel}</span>
        {insight.hasEnoughData && insight.insightSummary && (
          <span
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(e => !e)}
            onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
            style={{ fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)', userSelect: 'none' }}
          >
            &#9432;
          </span>
        )}
      </div>
      {expanded && insight.insightSummary && (
        <div style={{
          marginTop: 6, padding: '6px 10px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)', lineHeight: 1.5,
        }}>
          {insight.insightSummary}
        </div>
      )}
    </div>
  )
}

// FRONTEND-AGENT: ConfidenceIndicator complete
