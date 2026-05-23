// FRONTEND-AGENT: Build this screen first. Reference ./design/handoff/ for V2 approved design.
// Mobile: Input block → Generate Posts CTA → chip strip → active card → Skip/Regen/Approve
// Desktop: Left sidebar (platform queue) → Main panel (input + card with hero gradient)
export function ComposePage() {
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
        background: 'linear-gradient(135deg, var(--accent), #1E3A8A)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 17l1-4 12-12a2.2 2.2 0 013 3l-12 12-4 1z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M13 3l3 3" stroke="#fff" strokeWidth="1.6"/>
        </svg>
      </span>
      <span>COMPOSE — SPRINT 2</span>
    </div>
  )
}
