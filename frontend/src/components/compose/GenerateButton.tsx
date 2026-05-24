import React from 'react'

interface GenerateButtonProps {
  onGenerate: () => void
  generating?: boolean
  desktop?: boolean
  platformCount: number
}

export function GenerateButton({ onGenerate, generating, desktop, platformCount }: GenerateButtonProps) {
  return (
    <button
      onClick={onGenerate}
      disabled={generating}
      style={{
        width: '100%',
        height: desktop ? 46 : 50,
        borderRadius: 'var(--radius-button)',
        background: generating
          ? 'rgba(59,130,246,0.3)'
          : 'linear-gradient(135deg, #3B82F6 0%, #1E60D5 100%)',
        color: '#fff',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 14.5,
        letterSpacing: -0.2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        border: 'none',
        cursor: generating ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        boxShadow: generating ? 'none' : '0 0 24px rgba(59,130,246,0.35)',
        transition: 'opacity .15s, box-shadow .15s',
      }}
    >
      {generating ? (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          generating posts...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5v13M1.5 8h13" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <path d="M3 3l10 10M13 3L3 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          </svg>
          {`generate for ${platformCount} platform${platformCount === 1 ? '' : 's'}`}
        </>
      )}
    </button>
  )
}
