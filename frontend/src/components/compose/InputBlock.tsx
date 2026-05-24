import React, { useRef } from 'react'

interface InputBlockProps {
  prompt: string
  onPromptChange: (value: string) => void
  mediaUrl: string | null
  onMediaDrop: (url: string) => void
  desktop?: boolean
}

export function InputBlock({ prompt, onPromptChange, mediaUrl, onMediaDrop, desktop }: InputBlockProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onMediaDrop(url)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onMediaDrop(url)
    }
  }

  const squareSize = desktop ? 96 : 80

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: desktop ? '12px 0' : '10px 14px',
      flexShrink: 0,
    }}>
      {/* Media drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          width: squareSize,
          height: squareSize,
          flexShrink: 0,
          borderRadius: 'var(--radius-chip)',
          border: mediaUrl ? 'none' : '1.5px dashed rgba(255,255,255,0.18)',
          background: mediaUrl ? 'none' : 'rgba(255,255,255,0.03)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          transition: 'border-color .15s',
        }}
      >
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt="media"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.4 }}>
              <rect x="2" y="4" width="16" height="12" rx="2" stroke="white" strokeWidth="1.4" />
              <circle cx="7" cy="8.5" r="1.5" stroke="white" strokeWidth="1.4" />
              <path d="M2 13l4-3.5 3 2.5 3-3 6 4" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-muted)',
              marginTop: 5,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              drop media
            </span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Prompt textarea */}
      <textarea
        value={prompt}
        onChange={e => onPromptChange(e.target.value)}
        placeholder="what happened? what do you want to say? drop context and let kontrol write every platform..."
        style={{
          flex: 1,
          height: squareSize,
          background: 'rgba(255,255,255,0.04)',
          border: '1.5px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-chip)',
          padding: '10px 12px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: 1.5,
          resize: 'none',
          outline: 'none',
          transition: 'border-color .15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      />
    </div>
  )
}
