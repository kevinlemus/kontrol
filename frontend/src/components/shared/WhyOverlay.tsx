interface WhyOverlayProps {
  reasoning?: string | null
  onClose: () => void
}

export function WhyOverlay({ reasoning, onClose }: WhyOverlayProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
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
        padding: '20px 20px calc(24px + env(safe-area-inset-bottom))',
        zIndex: 201,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        animation: 'whySlideUp 220ms cubic-bezier(.17,.67,.3,1) forwards',
      }}>
        <style>{`
          @keyframes whySlideUp {
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>&#10024;</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)' }}>
              Why Kontrol AI suggested this
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Reasoning */}
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.8)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.7,
          margin: 0,
        }}>
          {reasoning || 'Based on your posting history and optimal time analysis for this platform.'}
        </p>
      </div>
    </>
  )
}

// FRONTEND-AGENT: WhyOverlay complete
