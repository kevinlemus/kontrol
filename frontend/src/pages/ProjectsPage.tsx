// FRONTEND-AGENT: Project list + detail. Each project shows: name, what_it_is, active platforms, current_status.
export function ProjectsPage() {
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
          <rect x="2" y="2" width="7" height="6" rx="1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <rect x="11" y="2" width="7" height="6" rx="1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <rect x="2" y="11" width="7" height="6" rx="1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <rect x="11" y="11" width="7" height="6" rx="1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
        </svg>
      </span>
      <span>PROJECTS — SPRINT 2</span>
    </div>
  )
}
