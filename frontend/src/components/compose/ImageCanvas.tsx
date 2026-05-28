import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '../shared/Toast'
import { imageApi } from '../../api/imageApi'

type StylePreset = 'bold-centered' | 'subtitle-strip' | 'top-banner' | 'floating'
type TextPosition = 'top' | 'center' | 'bottom'

const TEXT_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Yellow', value: '#FFD700' },
]

interface ImageCanvasProps {
  imageUrl: string
  imageId: string
  imagePrompt: string
  seed: number
  hookText: string
  onExport: (dataUrl: string) => void
  onRegenerate: () => void
  onStartFresh: () => void
}

export function ImageCanvas({
  imageUrl,
  imageId,
  hookText,
  onExport,
  onRegenerate: _onRegenerate,
  onStartFresh: _onStartFresh,
}: ImageCanvasProps) {
  const { showToast } = useToast()
  const [overlayText, setOverlayText] = useState(hookText)
  const [showText, setShowText] = useState(true)
  const [fontSize, setFontSize] = useState(32)
  const [textColor, setTextColor] = useState('#ffffff')
  const [customColor, setCustomColor] = useState('#ffffff')
  const [preset, setPreset] = useState<StylePreset>('bold-centered')
  const [position, setPosition] = useState<TextPosition>('center')
  const [showAiBadge, setShowAiBadge] = useState(true)
  const [styleLocked] = useState(true)
  const [regenLoading, setRegenLoading] = useState(false)
  const [freshLoading, setFreshLoading] = useState(false)
  const [showFreshConfirm, setShowFreshConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Apply preset changes
  useEffect(() => {
    if (preset === 'top-banner') setPosition('top')
    else if (preset === 'subtitle-strip') setPosition('bottom')
    else if (preset === 'floating') setPosition('center')
    else setPosition('center')
  }, [preset])

  const getPresetStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: 'var(--font-body)',
      fontSize: fontSize,
      color: textColor,
      textAlign: 'center',
      padding: '4px 12px',
      maxWidth: '90%',
      wordBreak: 'break-word',
      lineHeight: 1.3,
    }
    switch (preset) {
      case 'bold-centered':
        return { ...base, fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.8)', letterSpacing: -0.5 }
      case 'subtitle-strip':
        return { ...base, fontWeight: 700, background: 'rgba(0,0,0,0.65)', padding: '6px 16px', borderRadius: 4, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }
      case 'top-banner':
        return { ...base, fontWeight: 800, background: 'rgba(0,0,0,0.55)', padding: '8px 16px', borderRadius: 4, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }
      case 'floating':
        return {
          ...base,
          fontWeight: 700,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          padding: '8px 16px',
          borderRadius: 8,
        }
      default:
        return base
    }
  }

  const getPositionStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { top: 16, left: 0, right: 0 }
      case 'bottom':
        return { bottom: 16, left: 0, right: 0 }
      case 'center':
      default:
        return { top: '50%', left: 0, right: 0, transform: 'translateY(-50%)' }
    }
  }

  const handleRegenerate = async () => {
    setRegenLoading(true)
    try {
      await imageApi.regenerate({ imageId, variation: false })
      showToast('Style locked — keeping your visual style')
      _onRegenerate()
    } catch {
      showToast('Regeneration failed')
    } finally {
      setRegenLoading(false)
    }
  }

  const handleStartFresh = async () => {
    setFreshLoading(true)
    setShowFreshConfirm(false)
    try {
      await imageApi.regenerate({ imageId, variation: true })
      _onStartFresh()
    } catch {
      showToast('Failed to start fresh')
    } finally {
      setFreshLoading(false)
    }
  }

  const handleExport = useCallback(() => {
    if (!imgRef.current) return
    setExporting(true)
    const canvas = document.createElement('canvas')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      if (showText && overlayText) {
        ctx.font = `bold ${fontSize}px Geist Sans, sans-serif`
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'

        if (preset === 'subtitle-strip' || preset === 'top-banner') {
          ctx.fillStyle = 'rgba(0,0,0,0.65)'
          const stripH = fontSize + 24
          const stripY = preset === 'top-banner' ? 0 : canvas.height - stripH
          ctx.fillRect(0, stripY, canvas.width, stripH)
          ctx.fillStyle = textColor
        }

        const y = position === 'top'
          ? fontSize + 20
          : position === 'bottom'
          ? canvas.height - 20
          : canvas.height / 2

        ctx.font = `bold ${fontSize}px Geist Sans, sans-serif`
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.fillText(overlayText, canvas.width / 2, y)
      }
      onExport(canvas.toDataURL('image/png'))
      setExporting(false)
    }
    img.onerror = () => {
      showToast('Failed to export image')
      setExporting(false)
    }
  }, [imageUrl, showText, overlayText, fontSize, textColor, position, preset, onExport, showToast])

  const pillBase: React.CSSProperties = {
    padding: '5px 12px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    transition: 'background .12s, color .12s',
  }

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: '#3B82F6',
    color: '#fff',
  }

  const pillInactive: React.CSSProperties = {
    ...pillBase,
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.6)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Style locked indicator */}
      {styleLocked && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 8,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'rgba(59,130,246,0.9)',
        }}>
          <span>&#128274;</span> Style locked — your visual style is preserved on regen
        </div>
      )}

      {/* Image preview with text overlay */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#111' }}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Generated"
          style={{ width: '100%', display: 'block', borderRadius: 12 }}
          crossOrigin="anonymous"
        />

        {/* Text overlay */}
        {showText && overlayText && (
          <div style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...getPositionStyle(),
          }}>
            <span style={getPresetStyle()}>{overlayText}</span>
          </div>
        )}

        {/* AI generated badge */}
        {showAiBadge && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            borderRadius: 999,
            padding: '3px 8px 3px 6px',
          }}>
            <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'var(--font-mono)' }}>AI generated</span>
            <button
              onClick={() => setShowAiBadge(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                fontSize: 12,
              }}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Text toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div
            onClick={() => setShowText(v => !v)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: showText ? '#3B82F6' : 'rgba(255,255,255,0.12)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background .15s',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 2,
              left: showText ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left .15s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Show text overlay
          </span>
        </label>
      </div>

      {/* Text input */}
      {showText && (
        <input
          type="text"
          value={overlayText}
          onChange={e => setOverlayText(e.target.value)}
          placeholder="Enter overlay text..."
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />
      )}

      {showText && (
        <>
          {/* Style presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Style
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['bold-centered', 'subtitle-strip', 'top-banner', 'floating'] as StylePreset[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  style={preset === p ? pillActive : pillInactive}
                >
                  {p.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Position
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['top', 'center', 'bottom'] as TextPosition[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  style={position === p ? pillActive : pillInactive}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Font size: {fontSize}px
            </span>
            <input
              type="range"
              min={12}
              max={72}
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3B82F6' }}
            />
          </div>

          {/* Color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Color
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {TEXT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setTextColor(c.value)}
                  title={c.label}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c.value,
                    border: textColor === c.value ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    boxShadow: textColor === c.value ? '0 0 0 2px rgba(59,130,246,0.4)' : 'none',
                    transition: 'border .12s',
                    flexShrink: 0,
                  }}
                />
              ))}
              {/* Custom color */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={e => { setCustomColor(e.target.value); setTextColor(e.target.value) }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: !TEXT_COLORS.some(c => c.value === textColor) ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden',
                  }}
                  title="Custom color"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Regen / Start Fresh confirm dialog */}
      {showFreshConfirm && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <p style={{ fontSize: 14, color: '#fff', fontFamily: 'var(--font-body)', margin: 0 }}>
            This will generate a completely new style. Continue?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleStartFresh}
              disabled={freshLoading}
              style={{
                flex: 1,
                padding: '8px 0',
                background: freshLoading ? 'rgba(239,68,68,0.4)' : '#EF4444',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 700,
                cursor: freshLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {freshLoading ? 'Generating...' : 'Yes, start fresh'}
            </button>
            <button
              onClick={() => setShowFreshConfirm(false)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleRegenerate}
          disabled={regenLoading}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: regenLoading ? 'not-allowed' : 'pointer',
            opacity: regenLoading ? 0.6 : 1,
          }}
        >
          {regenLoading ? 'Generating...' : 'Regenerate'}
        </button>
        <button
          onClick={() => setShowFreshConfirm(true)}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Start fresh
        </button>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        style={{
          width: '100%',
          padding: '12px 0',
          background: exporting ? 'rgba(30,215,96,0.4)' : '#1ED760',
          border: 'none',
          borderRadius: 10,
          color: '#000',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontWeight: 800,
          cursor: exporting ? 'not-allowed' : 'pointer',
        }}
      >
        {exporting ? 'Exporting...' : 'Use this image'}
      </button>
    </div>
  )
}

// FRONTEND-AGENT: ImageCanvas complete
