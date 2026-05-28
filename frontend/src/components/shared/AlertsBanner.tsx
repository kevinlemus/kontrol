import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../../contexts/AlertsContext'
import type { AnalyticsAlert } from '../../api/analyticsApi'

// ─── Urgency styles ───────────────────────────────────────────────────────────

const URGENCY_STYLE: Record<string, {
  bg: string
  border: string
  dotColor: string
  labelColor: string
}> = {
  high: {
    bg: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.28)',
    dotColor: '#F59E0B',
    labelColor: '#F59E0B',
  },
  medium: {
    bg: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.22)',
    dotColor: '#3B82F6',
    labelColor: '#3B82F6',
  },
  low: {
    bg: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    dotColor: 'rgba(255,255,255,0.35)',
    labelColor: 'var(--text-muted)',
  },
}

const ACTION_LABEL: Record<string, string> = {
  boost: 'Boost →',
  compose: 'Compose →',
  schedule: 'Schedule →',
}

const ACTION_ROUTE: Record<string, string> = {
  boost: '/analytics',
  compose: '/compose',
  schedule: '/schedule',
}

// ─── Single alert row ─────────────────────────────────────────────────────────

function AlertRow({
  alert,
  idx,
}: {
  alert: AnalyticsAlert
  idx: number
}) {
  const navigate = useNavigate()
  const { dismissAlert } = useAlerts()
  const style = URGENCY_STYLE[alert.urgency] ?? URGENCY_STYLE.low

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 12px',
      borderRadius: 10,
      background: style.bg,
      border: style.border,
      marginBottom: 6,
    }}>
      {/* Urgency dot */}
      <span style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: style.dotColor,
        flexShrink: 0,
      }} />

      {/* Message */}
      <span style={{
        flex: 1,
        fontSize: 12,
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.45,
      }}>
        {alert.message}
      </span>

      {/* Action button */}
      {alert.action && ACTION_ROUTE[alert.action] && (
        <button
          onClick={() => navigate(ACTION_ROUTE[alert.action])}
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            border: style.border,
            background: 'none',
            color: style.labelColor,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            letterSpacing: 0.3,
          }}
        >
          {ACTION_LABEL[alert.action] ?? 'View →'}
        </button>
      )}

      {/* Dismiss × */}
      <button
        onClick={() => dismissAlert(idx)}
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          border: 'none',
          background: 'none',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          padding: 0,
        }}
        aria-label="Dismiss alert"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export function AlertsBanner() {
  const { alerts } = useAlerts()
  if (alerts.length === 0) return null

  // Show max 3, sorted by urgency (high → medium → low)
  const urgencyRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const sorted = [...alerts]
    .sort((a, b) => (urgencyRank[a.urgency] ?? 2) - (urgencyRank[b.urgency] ?? 2))
    .slice(0, 3)

  // Map sorted items back to their original indices for correct dismissal
  const sortedWithIdx = sorted.map(s => ({ alert: s, idx: alerts.indexOf(s) }))

  return (
    <div style={{ marginBottom: 6 }}>
      {sortedWithIdx.map(({ alert, idx }) => (
        <AlertRow key={`${alert.type}-${idx}`} alert={alert} idx={idx} />
      ))}
    </div>
  )
}
