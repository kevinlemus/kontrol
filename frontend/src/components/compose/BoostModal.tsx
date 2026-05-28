import { useState } from 'react'
import { strategyApi } from '../../api/strategyApi'
import { useToast } from '../shared/Toast'

interface BoostModalProps {
  postId: string
  platform: string
  onClose: () => void
}

const BUDGET_PILLS = [5, 10, 25]
const DURATION_PILLS = [
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: 'Ongoing', days: null },
]

const DEFAULT_AUDIENCE = {
  ageRange: '18-34',
  location: 'United States',
  interests: ['Social media', 'Technology', 'Entertainment'],
}

export function BoostModal({ postId, platform, onClose }: BoostModalProps) {
  const { showToast } = useToast()
  const [budget, setBudget] = useState<number>(10)
  const [customBudget, setCustomBudget] = useState('')
  const [showCustomBudget, setShowCustomBudget] = useState(false)
  const [duration, setDuration] = useState<number | null>(7)
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE)
  const [editingAudience, setEditingAudience] = useState(false)
  const [launching, setLaunching] = useState(false)

  const effectiveBudget = showCustomBudget ? (parseFloat(customBudget) || 0) : budget
  const estimatedReach = Math.round(effectiveBudget * (duration ?? 30) * 200)

  const formatReach = (n: number): string => {
    if (n >= 1000) return `~${(n / 1000).toFixed(1)}k`
    return `~${n}`
  }

  const handleLaunch = async () => {
    if (effectiveBudget <= 0) {
      showToast('Enter a valid budget')
      return
    }
    setLaunching(true)
    try {
      await strategyApi.createAd({
        postId,
        platform,
        dailyBudget: effectiveBudget,
        durationDays: duration,
        audience,
      })
      showToast('Ad campaign launched!')
      onClose()
    } catch {
      showToast('Failed to launch ad — try again')
    }
    setLaunching(false)
  }

  const pillBase: React.CSSProperties = {
    padding: '7px 14px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 700,
    transition: 'background .12s, color .12s',
    flexShrink: 0,
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#181818',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
        zIndex: 201,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideUp 250ms cubic-bezier(.17,.67,.3,1) forwards',
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>

        {/* Handle bar */}
        <div style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 16px',
        }} />

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-body)', marginBottom: 20 }}>
          Boost as Ad &#128640;
        </div>

        {/* Daily budget */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Daily budget
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BUDGET_PILLS.map(b => (
              <button
                key={b}
                onClick={() => { setBudget(b); setShowCustomBudget(false) }}
                style={{
                  ...pillBase,
                  background: !showCustomBudget && budget === b ? '#3B82F6' : 'rgba(255,255,255,0.07)',
                  color: !showCustomBudget && budget === b ? '#fff' : 'var(--text-secondary)',
                  border: !showCustomBudget && budget === b ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                ${b}/day
              </button>
            ))}
            <button
              onClick={() => setShowCustomBudget(true)}
              style={{
                ...pillBase,
                background: showCustomBudget ? '#3B82F6' : 'rgba(255,255,255,0.07)',
                color: showCustomBudget ? '#fff' : 'var(--text-secondary)',
                border: showCustomBudget ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Custom
            </button>
          </div>
          {showCustomBudget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 14 }}>$</span>
              <input
                type="number"
                value={customBudget}
                onChange={e => setCustomBudget(e.target.value)}
                placeholder="Enter amount"
                min={1}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  outline: 'none',
                }}
                autoFocus
              />
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 12 }}>/day</span>
            </div>
          )}
        </div>

        {/* Duration */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Duration
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DURATION_PILLS.map(d => (
              <button
                key={d.label}
                onClick={() => setDuration(d.days)}
                style={{
                  ...pillBase,
                  background: duration === d.days ? '#3B82F6' : 'rgba(255,255,255,0.07)',
                  color: duration === d.days ? '#fff' : 'var(--text-secondary)',
                  border: duration === d.days ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Audience Card */}
        <div style={{
          background: '#282828',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>&#127775;</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)' }}>
                AI suggested audience
              </span>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: '#3B82F6',
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 999,
                padding: '2px 6px',
                letterSpacing: 0.3,
              }}>
                AI
              </span>
            </div>
            <button
              onClick={() => setEditingAudience(e => !e)}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '4px 10px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {editingAudience ? 'Done' : 'Edit'}
            </button>
          </div>

          {editingAudience ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Age range</label>
                <input
                  type="text"
                  value={audience.ageRange}
                  onChange={e => setAudience(a => ({ ...a, ageRange: e.target.value }))}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    outline: 'none',
                    marginTop: 4,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Location</label>
                <input
                  type="text"
                  value={audience.location}
                  onChange={e => setAudience(a => ({ ...a, location: e.target.value }))}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    outline: 'none',
                    marginTop: 4,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Interests (comma separated)</label>
                <input
                  type="text"
                  value={audience.interests.join(', ')}
                  onChange={e => setAudience(a => ({ ...a, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    outline: 'none',
                    marginTop: 4,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 60, flexShrink: 0 }}>Age</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{audience.ageRange}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 60, flexShrink: 0 }}>Location</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{audience.location}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 60, flexShrink: 0 }}>Interests</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  {audience.interests.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Estimated reach */}
        <div style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Estimated reach
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#3B82F6', fontFamily: 'var(--font-body)' }}>
            {formatReach(estimatedReach)} people
          </span>
        </div>

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={launching}
          style={{
            width: '100%',
            padding: '14px 0',
            background: launching ? 'rgba(59,130,246,0.4)' : '#3B82F6',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 800,
            cursor: launching ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {launching ? 'Launching...' : 'Launch Ad &#128640;'}
        </button>
      </div>
    </>
  )
}

// FRONTEND-AGENT: BoostModal complete
