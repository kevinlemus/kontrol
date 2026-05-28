import { useState, useEffect, useRef } from 'react'
import { analyticsApi } from '../../api/analyticsApi'
import type { HookInsight } from '../../api/analyticsApi'

interface HookPerformanceProps {
  hookText: string
  projectId: string | null
  platform: string
}

const HIGH_PERF_KEYWORDS = [
  'question', 'how', 'why', 'what', 'reveal', 'secret', 'truth', 'you',
  'mistake', 'never', 'stop', 'start', 'best', 'worst', 'finally', 'breaking',
]

function detectHookStyle(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('?')) return 'question'
  if (lower.startsWith('how')) return 'how-to'
  if (lower.startsWith('why')) return 'why'
  if (lower.includes('never') || lower.includes('mistake') || lower.includes('stop')) return 'negative'
  if (lower.includes('secret') || lower.includes('reveal') || lower.includes('truth')) return 'reveal'
  if (lower.includes('breaking') || lower.includes('finally') || lower.includes('just')) return 'news'
  for (const kw of HIGH_PERF_KEYWORDS) {
    if (lower.includes(kw)) return kw
  }
  return 'statement'
}

export function HookPerformance({ hookText, projectId, platform }: HookPerformanceProps) {
  const [insights, setInsights] = useState<HookInsight[]>([])
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    const key = `${projectId}:${platform}`
    if (loadedRef.current === key) return
    loadedRef.current = key

    analyticsApi.hookInsights(projectId, platform)
      .then(data => setInsights(data ?? []))
      .catch(() => {})
  }, [projectId, platform])

  if (!hookText || !hookText.trim() || insights.length === 0) return null

  const detectedStyle = detectHookStyle(hookText)
  const matchingInsight = insights.find(i =>
    i.hookStyle.toLowerCase().includes(detectedStyle) ||
    detectedStyle.includes(i.hookStyle.toLowerCase())
  )

  // Find the best-performing style to suggest
  const bestInsight = [...insights].sort((a, b) => b.avgScore - a.avgScore)[0]

  if (matchingInsight && matchingInsight.avgScore >= 65) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
        paddingLeft: 2,
      }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1.5 6l2.5 2.5 6-6" stroke="#1ED760" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{
          fontSize: 11,
          color: '#1ED760',
          fontFamily: 'var(--font-body)',
        }}>
          This style performs well for you
        </span>
      </div>
    )
  }

  if (bestInsight && bestInsight.hookStyle !== matchingInsight?.hookStyle) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
        paddingLeft: 2,
      }}>
        <span style={{ fontSize: 11 }}>&#128161;</span>
        <span style={{
          fontSize: 11,
          color: '#FFD700',
          fontFamily: 'var(--font-body)',
        }}>
          Try a {bestInsight.hookStyle} hook — higher engagement for you
        </span>
      </div>
    )
  }

  return null
}

// FRONTEND-AGENT: HookPerformance complete
