
interface ActionRowProps {
  onApprove: () => void
  onRegenerate: () => void
  onSkip: () => void
  desktop?: boolean
}

export function ActionRow({ onApprove, onRegenerate, onSkip, desktop }: ActionRowProps) {
  const height = desktop ? 56 : 48

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 14px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {/* Approve — most prominent */}
      <button
        onClick={onApprove}
        style={{
          height,
          paddingLeft: 24,
          paddingRight: 24,
          borderRadius: 'var(--radius-pill)',
          background: '#1ED760',
          color: '#000',
          fontFamily: 'var(--font-body)',
          fontWeight: 800,
          fontSize: 14.5,
          letterSpacing: -0.2,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(30,215,96,0.4)',
          flexShrink: 0,
          transition: 'transform .1s, box-shadow .1s',
        }}
        onMouseDown={e => {
          e.currentTarget.style.transform = 'scale(0.97)'
          e.currentTarget.style.boxShadow = '0 0 12px rgba(30,215,96,0.3)'
        }}
        onMouseUp={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(30,215,96,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(30,215,96,0.4)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7.5l3 3 7-7" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Approve
      </button>

      {/* Regenerate */}
      <button
        onClick={onRegenerate}
        style={{
          height,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 'var(--radius-pill)',
          background: 'transparent',
          border: '1.5px solid #3A3A3A',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 13.5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#5A5A5A' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A' }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M11 6.5A4.5 4.5 0 112.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2.5 1v2.5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Regen
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          width: height,
          height,
          borderRadius: 'var(--radius-pill)',
          background: 'transparent',
          border: '1.5px solid #2A2A2A',
          color: 'rgba(255,255,255,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'border-color .15s, color .15s',
        }}
        title="Skip"
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#FF4500'
          e.currentTarget.style.color = '#FF4500'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#2A2A2A'
          e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* More */}
      <button
        style={{
          width: height,
          height,
          borderRadius: 'var(--radius-pill)',
          background: 'transparent',
          border: '1.5px solid #2A2A2A',
          color: 'rgba(255,255,255,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="More options"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="7" r="1.2" fill="currentColor" />
          <circle cx="7" cy="7" r="1.2" fill="currentColor" />
          <circle cx="11" cy="7" r="1.2" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}
