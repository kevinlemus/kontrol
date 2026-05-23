// FRONTEND-AGENT: Reddit monitor. Suggestion cards: pending / posted / dismissed.
// Each card shows: subreddit, post title, post URL, suggested comment text.
// Approve → posts comment. Dismiss → removes card. Edit inline before approving.
export function RedditPage() {
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
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'var(--font-body)',
        fontSize: 18,
        fontWeight: 800,
      }}>
        r/
      </span>
      <span>REDDIT MONITOR — SPRINT 2</span>
    </div>
  )
}
