// FRONTEND-AGENT: Calendar view of scheduled posts. Post now or pick date/time.
// Claude suggests optimal times per platform. Edit/cancel queued posts.
export function SchedulePage() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      letterSpacing: 1,
      gap: 12,
    }}>
      <span style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <path d="M10 5v5l3 2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span>SCHEDULE — SPRINT 2</span>
    </div>
  )
}
