import { useState, useMemo, Fragment } from 'react'
import { PlatformId, Platform, PlatformDraft } from './types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ScheduledEntry {
  platformId: PlatformId
  platformName: string
  platformGradient: string
  scheduledAt: string // ISO
  content: string
}

interface SmartScheduleModalProps {
  drafts: Record<PlatformId, PlatformDraft>
  enabledPlatforms: PlatformId[]
  platforms: Platform[]
  projectName: string
  onConfirm: (scheduledPosts: ScheduledEntry[]) => void
  onClose: () => void
}

// ─── Scheduling order ──────────────────────────────────────────────────────────

const SCHEDULE_ORDER: PlatformId[] = ['LI', 'X', 'RD', 'IG', 'FB', 'YT', 'TT', 'ST', 'IT', 'GJ']

// ─── Optimal time algorithm ────────────────────────────────────────────────────

function getOptimalTime(platformId: PlatformId, prevTime?: Date): Date {
  const now = new Date()

  function todayAt(h: number, m = 0) {
    const d = new Date(now); d.setHours(h, m, 0, 0); return d
  }
  function tomorrowAt(h: number, m = 0) {
    const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(h, m, 0, 0); return d
  }
  function firstFuture(...slots: Date[]): Date {
    return slots.find(t => t > now) ?? slots[slots.length - 1]
  }

  switch (platformId) {
    case 'IG': return firstFuture(todayAt(11), todayAt(19), tomorrowAt(11))
    case 'TT': return firstFuture(todayAt(19), tomorrowAt(19))
    case 'LI': {
      const d = new Date(now)
      for (let i = 0; i <= 7; i++) {
        const day = d.getDay()
        if ([2, 3, 4].includes(day)) {
          const t = new Date(d); t.setHours(9, 0, 0, 0)
          if (t > now) return t
        }
        d.setDate(d.getDate() + 1)
      }
      return tomorrowAt(9)
    }
    case 'RD': return firstFuture(todayAt(9), todayAt(20), tomorrowAt(9))
    case 'X':  return firstFuture(todayAt(8), todayAt(16), tomorrowAt(8))
    case 'FB': return firstFuture(todayAt(13), todayAt(15), tomorrowAt(13))
    case 'YT': return firstFuture(todayAt(15), todayAt(17), tomorrowAt(15))
    case 'ST':
    case 'IT':
    case 'GJ': {
      if (prevTime) {
        const t = new Date(prevTime); t.setMinutes(t.getMinutes() + 30); return t
      }
      return firstFuture(todayAt(12), tomorrowAt(12))
    }
    default: return tomorrowAt(12)
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function SmartScheduleModal({
  drafts,
  enabledPlatforms,
  platforms,
  onConfirm,
  onClose,
}: SmartScheduleModalProps) {
  const initialEntries = useMemo<ScheduledEntry[]>(() => {
    const approved = SCHEDULE_ORDER.filter(
      id => enabledPlatforms.includes(id) && drafts[id]?.status === 'approved'
    )

    let prevGameTime: Date | undefined
    return approved.map(id => {
      const isGame = ['ST', 'IT', 'GJ'].includes(id)
      const t = getOptimalTime(id, isGame ? prevGameTime : undefined)
      if (isGame) prevGameTime = t
      const plat = platforms.find(p => p.id === id)!
      return {
        platformId: id,
        platformName: plat.name,
        platformGradient: plat.gradient,
        scheduledAt: t.toISOString(),
        content: drafts[id].content,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [entries, setEntries] = useState<ScheduledEntry[]>(initialEntries)

  const mockNow = new Date()

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Panel — stop click propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}>
            Smart Schedule
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <p style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          marginBottom: 20,
          lineHeight: 1.5,
          margin: '0 0 20px',
        }}>
          Posts staggered to optimal windows. Tap any time to adjust.
        </p>

        {/* Horizontal timeline */}
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content', padding: '0 4px' }}>
            {entries.map((entry, i) => {
              const t = new Date(entry.scheduledAt)
              const label = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              const isToday = t.toDateString() === mockNow.toDateString()
              return (
                <Fragment key={entry.platformId}>
                  {i > 0 && (
                    <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: entry.platformGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#fff',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {entry.platformId}
                    </div>
                    <span style={{
                      fontSize: 10,
                      color: isToday ? 'var(--text-secondary)' : 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                    }}>
                      {isToday ? label : `tmrw ${label}`}
                    </span>
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>

        {/* Editable list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, i) => {
            const t = new Date(entry.scheduledAt)
            const timeValue = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
            const isToday = t.toDateString() === mockNow.toDateString()

            return (
              <div
                key={entry.platformId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--bg-raised)',
                  borderRadius: 12,
                }}
              >
                {/* Swatch */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: entry.platformGradient,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                }}>
                  {entry.platformId}
                </div>

                {/* Name + day */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                  }}>
                    {entry.platformName}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {isToday ? 'Today' : 'Tomorrow'}
                  </div>
                </div>

                {/* Time override input */}
                <input
                  type="time"
                  value={timeValue}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number)
                    const newDate = new Date(entry.scheduledAt)
                    newDate.setHours(h, m, 0, 0)
                    setEntries(prev => prev.map((en, idx) =>
                      idx === i ? { ...en, scheduledAt: newDate.toISOString() } : en
                    ))
                  }}
                  style={{
                    background: 'var(--bg-active)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    outline: 'none',
                    flexShrink: 0,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => onConfirm(entries)}
            style={{
              flex: 1,
              padding: '14px 0',
              background: '#1ED760',
              color: '#000',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: -0.2,
            }}
          >
            Confirm Schedule
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '14px 20px',
              background: 'none',
              color: 'var(--text-muted)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// FRONTEND-AGENT: SmartScheduleModal complete
