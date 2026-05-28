import { useState, useEffect, useRef } from 'react'
import { strategyApi } from '../../api/strategyApi'
import type { CompetitorAnalysis } from '../../api/strategyApi'

interface CompetitorIntelligenceProps {
  projectId: string
  competitor1: string
  competitor2: string
  competitor3: string
  industry: string
  onFillCompetitor: (index: 0 | 1 | 2, value: string) => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export function CompetitorIntelligence({
  projectId,
  competitor1,
  competitor2,
  competitor3,
  industry,
  onFillCompetitor,
}: CompetitorIntelligenceProps) {
  const competitors = [competitor1, competitor2, competitor3].filter(c => c?.trim())
  const [analyses, setAnalyses] = useState<Record<string, CompetitorAnalysis>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAllAnalysis, setShowAllAnalysis] = useState(false)
  const [analyzeAllLoading, setAnalyzeAllLoading] = useState(false)

  // Competitor suggestions
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsVisible, setSuggestionsVisible] = useState(false)
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show suggestion banner when industry is filled but no competitors
  useEffect(() => {
    if (
      industry.trim() &&
      !competitor1?.trim() &&
      !competitor2?.trim() &&
      !competitor3?.trim() &&
      !suggestionsDismissed
    ) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await strategyApi.suggestCompetitors(projectId)
          if (data && data.length > 0) {
            setSuggestions(data.map(d => d.name))
            setSuggestionsVisible(true)
          }
        } catch {
          // Silent fail
        }
      }, 500)
    } else {
      setSuggestionsVisible(false)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, competitor1, competitor2, competitor3, projectId, suggestionsDismissed])

  const handleAnalyzeOne = async (name: string) => {
    if (!name.trim() || loadingMap[name]) return
    setLoadingMap(prev => ({ ...prev, [name]: true }))
    try {
      const data = await strategyApi.analyzeCompetitor({
        projectId,
        competitorName: name,
        platform: 'all',
      })
      setAnalyses(prev => ({ ...prev, [name]: data }))
      setExpanded(name)
    } catch {
      // Silent fail
    }
    setLoadingMap(prev => ({ ...prev, [name]: false }))
  }

  const handleAnalyzeAll = async () => {
    if (competitors.length === 0) return
    setAnalyzeAllLoading(true)
    setShowAllAnalysis(true)
    await Promise.all(competitors.map(c => handleAnalyzeOne(c)))
    setAnalyzeAllLoading(false)
  }

  const handleAddSuggestion = (name: string) => {
    const slots: Array<0 | 1 | 2> = [0, 1, 2]
    const empties = slots.filter(i => {
      const vals = [competitor1, competitor2, competitor3]
      return !vals[i]?.trim()
    })
    if (empties.length > 0) {
      onFillCompetitor(empties[0], name)
      setSuggestions(prev => prev.filter(s => s !== name))
    }
  }

  if (competitors.length === 0 && !suggestionsVisible) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
      {/* Suggestion banner */}
      {suggestionsVisible && suggestions.length > 0 && (
        <div style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Top accounts in {industry}:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestions.map(name => (
              <button
                key={name}
                onClick={() => handleAddSuggestion(name)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#3B82F6',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                suggestions.forEach((name, i) => {
                  const idx = i as 0 | 1 | 2
                  if (idx <= 2) onFillCompetitor(idx, name)
                })
                setSuggestionsVisible(false)
              }}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                padding: 0,
              }}
            >
              Add suggested competitors
            </button>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>|</span>
            <button
              onClick={() => { setSuggestionsVisible(false); setSuggestionsDismissed(true) }}
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                padding: 0,
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Analyze all button */}
      {competitors.length > 0 && (
        <button
          onClick={handleAnalyzeAll}
          disabled={analyzeAllLoading}
          style={{
            width: '100%',
            padding: '9px 0',
            background: analyzeAllLoading ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 8,
            color: '#3B82F6',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            cursor: analyzeAllLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {analyzeAllLoading ? 'Analyzing competitors...' : 'Analyze All Competitors'}
        </button>
      )}

      {/* Per-competitor analysis results */}
      {showAllAnalysis && competitors.map(name => {
        const analysis = analyses[name]
        const loading = loadingMap[name]
        const isExpanded = expanded === name

        return (
          <div key={name} style={{
            background: '#181818',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {/* Header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : name)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                }}>
                  {name.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)' }}>
                  {name}
                </span>
                {loading && (
                  <span style={{ fontSize: 11, color: '#3B82F6', fontFamily: 'var(--font-mono)' }}>
                    Analyzing...
                  </span>
                )}
                {analysis && !loading && (
                  <span style={{ fontSize: 10, color: '#1ED760', fontFamily: 'var(--font-mono)' }}>
                    &#10003; Done
                  </span>
                )}
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform .2s',
                  opacity: 0.5,
                }}
              >
                <path d="M3 5.5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Expanded analysis */}
            {isExpanded && analysis && (
              <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Posting frequency */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, width: 120 }}>Posting frequency</span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: '#3B82F6',
                  }}>
                    {analysis.postingFrequency}
                  </span>
                </div>

                {/* Top content types */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Top content types</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {analysis.topContentTypes.map(type => (
                      <span key={type} style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.07)',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                      }}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Engagement patterns */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Engagement patterns</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.5 }}>
                    {analysis.engagementPatterns}
                  </p>
                </div>

                {/* How to beat them */}
                {analysis.differentiationTips.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#1ED760',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}>
                      How to beat them
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {analysis.differentiationTips.map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: '#1ED760', fontSize: 12, flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                            {tip}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last analyzed + refresh */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Analyzed {formatDate(analysis.analyzedAt)}
                  </span>
                  <button
                    onClick={() => void handleAnalyzeOne(name)}
                    disabled={loadingMap[name]}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '3px 10px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      cursor: loadingMap[name] ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loadingMap[name] ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// FRONTEND-AGENT: CompetitorIntelligence complete
