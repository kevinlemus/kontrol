import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '../components/shared/PageHeader'
import { useToast } from '../components/shared/Toast'
import { analyticsApi } from '../api/analyticsApi'
import { projectsApi } from '../api/projects'
import { AlertsBanner } from '../components/shared/AlertsBanner'
import type {
  AnalyticsOverview,
  AnalyticsPost,
  AnalyticsInsight,
  WeeklyReport,
  HookInsight,
} from '../api/analyticsApi'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiProject {
  id: string
  name: string
  active: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const PLATFORMS_LIST = ['IG', 'TT', 'LI', 'RD', 'X', 'FB', 'YT']

function scoreColor(score: number): string {
  if (score >= 70) return '#1ED760'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = 16, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: 'rgba(255,255,255,0.07)',
      flexShrink: 0,
    }} />
  )
}

// ─── Overview Card ────────────────────────────────────────────────────────────

function OverviewCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: '#181818',
      borderRadius: 12,
      padding: 16,
      minWidth: 130,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-body)', letterSpacing: -0.5 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{sub}</span>
      )}
    </div>
  )
}

// ─── Tab Pills ────────────────────────────────────────────────────────────────

function TabPills({
  tabs, active, onChange,
}: {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      paddingBottom: 2,
      flexShrink: 0,
    }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: active === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
            background: active === t ? '#3B82F6' : 'rgba(255,255,255,0.05)',
            color: active === t ? '#fff' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            letterSpacing: 0.3,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { showToast } = useToast()

  // Projects
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  // Top-level tab
  const [mainTab, setMainTab] = useState<'overview' | 'reports'>('overview')

  // Platform filter tab
  const [platformTab, setPlatformTab] = useState('All')

  // Data
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [posts, setPosts] = useState<AnalyticsPost[]>([])
  const [insight, setInsight] = useState<AnalyticsInsight | null>(null)
  const [hookInsights, setHookInsights] = useState<HookInsight[]>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [allReports, setAllReports] = useState<WeeklyReport[]>([])
  const [checkedRecs, setCheckedRecs] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('kontrol_analytics_recs') ?? '{}') as Record<string, boolean>
    } catch { return {} }
  })

  // Loading states
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)
  const [insightLoading, setInsightLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [genReportLoading, setGenReportLoading] = useState(false)

  // Report expansions
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())

  // Load projects
  useEffect(() => {
    projectsApi.list()
      .then(list => {
        const mapped = (list ?? []).map(p => ({ id: p.id, name: p.name, active: p.active }))
        setProjects(mapped)
        const active = mapped.find(p => p.active) ?? mapped[0]
        if (active) setActiveProjectId(active.id)
      })
      .catch(() => {})
  }, [])

  // Load analytics when project changes
  const loadAnalytics = useCallback(async (projectId: string) => {
    setOverviewLoading(true)
    setPostsLoading(true)
    setInsightLoading(true)

    try {
      const ov = await analyticsApi.overview(projectId)
      setOverview(ov)
    } catch { setOverview(null) }
    setOverviewLoading(false)

    try {
      const ps = await analyticsApi.posts(projectId, undefined, 20)
      setPosts(ps ?? [])
    } catch { setPosts([]) }
    setPostsLoading(false)

    try {
      const ins = await analyticsApi.insights(projectId)
      setInsight(ins)
    } catch { setInsight(null) }
    setInsightLoading(false)

    try {
      const hooks = await analyticsApi.hookInsights(projectId)
      setHookInsights(hooks ?? [])
    } catch { setHookInsights([]) }
  }, [])

  const loadReports = useCallback(async (projectId: string) => {
    setReportLoading(true)
    try {
      const [weekly, all] = await Promise.all([
        analyticsApi.weeklyReport(projectId).catch(() => null),
        analyticsApi.reports(projectId).catch(() => []),
      ])
      setWeeklyReport(weekly)
      setAllReports(all ?? [])
    } catch {
      setWeeklyReport(null)
      setAllReports([])
    }
    setReportLoading(false)
  }, [])

  useEffect(() => {
    if (!activeProjectId) return
    void loadAnalytics(activeProjectId)
    void loadReports(activeProjectId)
  }, [activeProjectId, loadAnalytics, loadReports])

  // Platform tab filtering
  const filteredPosts = platformTab === 'All'
    ? posts
    : posts.filter(p => p.platform === platformTab)

  // Build chart data from posts
  const chartData = posts.reduce<{ date: string; [key: string]: number | string }[]>((acc, p) => {
    const date = formatDate(p.publishedAt)
    const existing = acc.find(d => d.date === date)
    if (existing) {
      const prev = (existing[p.platform] as number | undefined) ?? 0
      existing[p.platform] = Math.round((prev + p.performanceScore) / 2)
    } else {
      acc.push({ date, [p.platform]: p.performanceScore })
    }
    return acc
  }, [])

  // Unique platforms from posts
  const uniquePlatforms = Array.from(new Set(posts.map(p => p.platform))).filter(Boolean)

  const handleRefreshInsights = async () => {
    if (!activeProjectId) return
    setInsightLoading(true)
    try {
      const ins = await analyticsApi.insights(activeProjectId)
      setInsight(ins)
    } catch {
      showToast('Failed to refresh insights')
    }
    setInsightLoading(false)
  }

  const handleGenerateReport = async () => {
    if (!activeProjectId) return
    setGenReportLoading(true)
    try {
      const report = await analyticsApi.generateReport(activeProjectId)
      setWeeklyReport(report)
      showToast('Report generated')
    } catch {
      showToast('Failed to generate report')
    }
    setGenReportLoading(false)
  }

  const toggleRec = (key: string) => {
    setCheckedRecs(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('kontrol_analytics_recs', JSON.stringify(next))
      return next
    })
  }

  const toggleReportExpand = (id: string) => {
    setExpandedReports(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeProject = projects.find(p => p.id === activeProjectId)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Print CSS */}
      <style>{`
        @media print {
          nav, .bottom-nav, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { background: white; color: black; padding: 20px; }
        }
      `}</style>

      <PageHeader
        title="Analytics"
        rightSlot={
          <div style={{ position: 'relative' }}>
            <select
              value={activeProjectId ?? ''}
              onChange={e => setActiveProjectId(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '5px 28px 5px 10px',
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
              <path d="M2 4l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        }
      />

      {/* Main tab toggle */}
      <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 999,
          padding: 3,
          gap: 2,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['overview', 'reports'] as const).map(t => (
            <button
              key={t}
              onClick={() => setMainTab(t)}
              style={{
                padding: '6px 16px',
                borderRadius: 999,
                border: 'none',
                background: mainTab === t ? 'var(--bg-raised)' : 'transparent',
                color: mainTab === t ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: mainTab === t ? 700 : 500,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background .15s, color .15s',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px calc(80px + env(safe-area-inset-bottom))' }} className="print-page">

        <div style={{ paddingTop: 16 }}>
          <AlertsBanner />
        </div>

        {mainTab === 'overview' && (
          <>
            {/* Not enough data banner */}
            {overview && !overview.hasEnoughData && (
              <div style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>&#128202;</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                    Post more to unlock insights
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    Publish at least 10 posts to see performance trends
                  </div>
                </div>
              </div>
            )}

            {/* Overview cards */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                paddingBottom: 4,
              }}>
                {overviewLoading ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} style={{ background: '#181818', borderRadius: 12, padding: 16, minWidth: 130, flexShrink: 0 }}>
                      <Skeleton width={60} height={12} />
                      <div style={{ marginTop: 8 }}><Skeleton width={80} height={24} radius={4} /></div>
                    </div>
                  ))
                ) : (
                  <>
                    <OverviewCard label="Total Posts" value={overview?.totalPosts?.toString() ?? '—'} />
                    <OverviewCard label="Avg Engagement" value={overview?.avgEngagement != null ? `${overview.avgEngagement.toFixed(1)}%` : '—'} />
                    <OverviewCard label="Best Platform" value={overview?.bestPlatform ?? '—'} />
                    <OverviewCard label="Best Time" value={overview?.bestTime ?? '—'} />
                  </>
                )}
              </div>
            </div>

            {/* Performance chart */}
            <div style={{
              background: '#181818',
              borderRadius: 16,
              padding: '16px 12px',
              marginBottom: 20,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
                Engagement over time
              </div>
              {chartData.length === 0 ? (
                <div style={{
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                }}>
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#181818',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                    {uniquePlatforms.map(platform => (
                      <Line
                        key={platform}
                        type="monotone"
                        dataKey={platform}
                        stroke={PLATFORM_COLORS[platform] ?? '#3B82F6'}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Platform tabs */}
            <div style={{ marginBottom: 14 }}>
              <TabPills
                tabs={['All', ...PLATFORMS_LIST]}
                active={platformTab}
                onChange={setPlatformTab}
              />
            </div>

            {/* Posts list */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
                Top performing posts
              </div>
              {postsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} style={{ background: '#181818', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Skeleton width={36} height={20} radius={999} />
                      <Skeleton height={12} />
                    </div>
                  </div>
                ))
              ) : filteredPosts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                }}>
                  No posts yet
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} style={{
                    background: '#181818',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                  }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: PLATFORM_COLORS[post.platform] ?? '#3B82F6',
                      color: '#fff',
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      flexShrink: 0,
                      letterSpacing: 0.5,
                    }}>
                      {post.platform}
                    </span>
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {post.content.length > 80 ? post.content.slice(0, 80) + '…' : post.content}
                    </span>
                    <span style={{
                      flexShrink: 0,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(0,0,0,0.3)',
                      color: scoreColor(post.performanceScore),
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}>
                      {post.performanceScore}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* AI Insights */}
            <div style={{
              background: '#181818',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>&#10024;</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)' }}>
                    AI Insights
                  </span>
                </div>
                <button
                  onClick={handleRefreshInsights}
                  disabled={insightLoading}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    color: '#3B82F6',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    cursor: insightLoading ? 'not-allowed' : 'pointer',
                    opacity: insightLoading ? 0.5 : 1,
                  }}
                >
                  {insightLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {insightLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton height={12} />
                  <Skeleton height={12} width="80%" />
                  <Skeleton height={12} width="60%" />
                </div>
              ) : insight ? (
                <>
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.6,
                    margin: '0 0 8px',
                  }}>
                    {insight.insightText}
                  </p>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Updated {formatDate(insight.updatedAt)}
                  </span>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  {activeProjectId ? 'No insights yet — keep posting to build your profile.' : 'Select a project to see insights.'}
                </p>
              )}
            </div>

            {/* What hooks work */}
            {hookInsights.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
                  What hooks work
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 4 }}>
                  {hookInsights.map(hook => (
                    <div key={hook.hookStyle} style={{
                      background: '#181818',
                      borderRadius: 12,
                      padding: '12px 14px',
                      minWidth: 200,
                      flexShrink: 0,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                        {hook.hookStyle}
                      </div>
                      <div style={{ fontSize: 11, color: scoreColor(hook.avgScore), fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                        Avg score: {hook.avgScore}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                        {hook.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {mainTab === 'reports' && (
          <>
            {/* Weekly report */}
            {reportLoading ? (
              <div style={{ background: '#181818', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <Skeleton height={14} width="60%" />
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton height={12} />
                  <Skeleton height={12} width="80%" />
                  <Skeleton height={12} width="70%" />
                </div>
              </div>
            ) : weeklyReport ? (
              <div style={{
                background: '#181818',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Most Recent Weekly Report — {formatDate(weeklyReport.generatedAt)}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  {weeklyReport.summary}
                </p>
                {/* Key metrics */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {weeklyReport.metrics.map(m => (
                    <div key={m.label} style={{
                      background: '#282828',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      flex: '1 1 100px',
                    }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{m.label}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-body)' }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                {/* Recommendations */}
                {weeklyReport.recommendations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Recommendations
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {weeklyReport.recommendations.map((rec, i) => {
                        const key = `${weeklyReport.id}-${i}`
                        return (
                          <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checkedRecs[key] ?? false}
                              onChange={() => toggleRec(key)}
                              style={{ marginTop: 2, accentColor: '#1ED760', flexShrink: 0 }}
                            />
                            <span style={{
                              fontSize: 13,
                              color: checkedRecs[key] ? 'var(--text-muted)' : 'var(--text-secondary)',
                              fontFamily: 'var(--font-body)',
                              lineHeight: 1.5,
                              textDecoration: checkedRecs[key] ? 'line-through' : 'none',
                              transition: 'color .15s',
                            }}>
                              {rec.text}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Previous reports */}
            {allReports.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Previous Reports
                </div>
                {allReports.slice(1).map(report => (
                  <div key={report.id} style={{ background: '#181818', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleReportExpand(report.id)}
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
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                        Week of {formatDate(report.generatedAt)}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 14, transform: expandedReports.has(report.id) ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                        &#8964;
                      </span>
                    </button>
                    {expandedReports.has(report.id) && (
                      <div style={{ padding: '0 14px 14px' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: 0 }}>
                          {report.summary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                onClick={handleGenerateReport}
                disabled={genReportLoading || !activeProjectId}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: genReportLoading ? 'rgba(59,130,246,0.4)' : '#3B82F6',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: genReportLoading || !activeProjectId ? 'not-allowed' : 'pointer',
                  opacity: !activeProjectId ? 0.5 : 1,
                  minWidth: 160,
                }}
              >
                {genReportLoading ? 'Generating...' : 'Generate Report Now'}
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 120,
                }}
              >
                Share as PDF
              </button>
            </div>

            {/* Active project info in reports tab */}
            {activeProject && (
              <div style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                paddingBottom: 8,
              }}>
                Showing data for {activeProject.name}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// FRONTEND-AGENT: AnalyticsPage complete
