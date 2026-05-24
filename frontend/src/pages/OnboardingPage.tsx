import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

type StyleOption = 'Casual' | 'Professional' | 'Hype' | 'Dry'
type AvoidOption = 'Corporate' | 'Salesy' | 'Try-hard slang' | 'Motivational quotes'
type SelectedPath = 'questions' | 'import' | 'skip' | null

const STYLE_OPTIONS: StyleOption[] = ['Casual', 'Professional', 'Hype', 'Dry']
const AVOID_OPTIONS: AvoidOption[] = ['Corporate', 'Salesy', 'Try-hard slang', 'Motivational quotes']

const TOTAL_SCREENS = 6

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 48,
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 999,
            background: i <= current ? '#3B82F6' : 'rgba(255,255,255,0.15)',
            transition: 'width .25s, background .25s',
          }}
        />
      ))}
    </div>
  )
}

// ─── Pill select ──────────────────────────────────────────────────────────────

function PillOption({
  label,
  selected,
  onToggle,
}: {
  label: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        padding: '10px 20px',
        borderRadius: 12,
        border: selected ? '1.5px solid #3B82F6' : '1.5px solid rgba(255,255,255,0.1)',
        background: selected ? 'rgba(59,130,246,0.12)' : '#181818',
        color: selected ? '#fff' : 'rgba(255,255,255,0.6)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'border-color .15s, background .15s, color .15s',
      }}
    >
      {label}
    </button>
  )
}

// ─── Shared Continue button ───────────────────────────────────────────────────

function ContinueButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '14px 0',
        background: disabled ? 'rgba(59,130,246,0.4)' : '#3B82F6',
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background .15s, opacity .15s',
      }}
    >
      Continue
    </button>
  )
}

// ─── Screen 0 — Path Selection ────────────────────────────────────────────────

interface PathCardProps {
  icon: string
  title: string
  subtitle: string
  selected: boolean
  onSelect: () => void
  recommended?: boolean
}

function PathCard({ icon, title, subtitle, selected, onSelect, recommended = false }: PathCardProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        position: 'relative',
        background: selected ? 'rgba(59,130,246,0.08)' : '#181818',
        border: selected ? '1.5px solid #3B82F6' : '1.5px solid #2a2a2a',
        borderRadius: 14,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      {recommended && (
        <span style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: '#3B82F6',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          padding: '3px 8px',
          borderRadius: 999,
          letterSpacing: 0.2,
        }}>
          Recommended
        </span>
      )}
      <div style={{
        fontSize: 28,
        marginBottom: 10,
        lineHeight: 1,
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 17,
        fontWeight: 700,
        color: '#fff',
        marginBottom: 6,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: '#888',
        lineHeight: 1.5,
      }}>
        {subtitle}
      </div>
    </div>
  )
}

function Screen0({
  selectedPath,
  setSelectedPath,
  onContinue,
}: {
  selectedPath: SelectedPath
  setSelectedPath: (p: SelectedPath) => void
  onContinue: () => void
}) {
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 26,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 8,
        letterSpacing: -0.4,
        textAlign: 'center',
        lineHeight: 1.25,
      }}>
        How do you want to set up your voice?
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 28,
        textAlign: 'center',
      }}>
        You can always change this later in Settings.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 28,
      }}>
        <PathCard
          icon="✏️"
          title="Set up your voice now"
          subtitle="Answer 4 quick questions and Kontrol learns how you talk from day one. Takes 2 minutes."
          selected={selectedPath === 'questions'}
          onSelect={() => setSelectedPath('questions')}
          recommended
        />
        <PathCard
          icon="📱"
          title="Learn from my existing posts"
          subtitle="Connect Instagram, TikTok, or Reddit and Kontrol analyzes your real posts to match your style automatically."
          selected={selectedPath === 'import'}
          onSelect={() => setSelectedPath('import')}
        />
        <PathCard
          icon="🚀"
          title="Skip for now — learn as I go"
          subtitle="Kontrol starts simple and gets smarter every time you edit a generated post. No setup needed."
          selected={selectedPath === 'skip'}
          onSelect={() => setSelectedPath('skip')}
        />
      </div>

      <ContinueButton
        disabled={selectedPath === null}
        onClick={onContinue}
      />
    </>
  )
}

// ─── Screen 1 — Name ──────────────────────────────────────────────────────────

function Screen1({ name, setName, onNext }: {
  name: string
  setName: (v: string) => void
  onNext: () => void
}) {
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 26,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 8,
        letterSpacing: -0.4,
        textAlign: 'center',
      }}>
        What should we call you?
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 32,
        textAlign: 'center',
      }}>
        This is just for your profile.
      </p>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name"
        autoFocus
        style={{
          width: '100%',
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '14px 16px',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 24,
          transition: 'border-color .15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onNext() }}
      />
      <ContinueButton disabled={!name.trim()} onClick={onNext} />
    </>
  )
}

// ─── Screen 2 — Style Pills ───────────────────────────────────────────────────

function Screen2({ styles, toggleStyle, onNext }: {
  styles: Set<StyleOption>
  toggleStyle: (s: StyleOption) => void
  onNext: () => void
}) {
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 26,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 8,
        letterSpacing: -0.4,
        textAlign: 'center',
      }}>
        How do you talk online?
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 32,
        textAlign: 'center',
      }}>
        Pick all that apply — you can mix them.
      </p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        {STYLE_OPTIONS.map(s => (
          <PillOption
            key={s}
            label={s}
            selected={styles.has(s)}
            onToggle={() => toggleStyle(s)}
          />
        ))}
      </div>
      <ContinueButton onClick={onNext} />
    </>
  )
}

// ─── Screen 3 — Voice Sample ──────────────────────────────────────────────────

function Screen3({ voiceSample, setVoiceSample, onNext }: {
  voiceSample: string
  setVoiceSample: (v: string) => void
  onNext: () => void
}) {
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 22,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 8,
        letterSpacing: -0.3,
        textAlign: 'center',
        lineHeight: 1.3,
      }}>
        Write one sentence like you&apos;d text a friend about something you just built.
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 24,
        textAlign: 'center',
      }}>
        Don&apos;t overthink it.
      </p>
      <textarea
        value={voiceSample}
        onChange={e => setVoiceSample(e.target.value)}
        placeholder="e.g. 'just dropped something idk if it slaps but i'm proud of it lol'"
        rows={4}
        autoFocus
        style={{
          width: '100%',
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '14px 16px',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          lineHeight: 1.6,
          outline: 'none',
          resize: 'none',
          boxSizing: 'border-box',
          marginBottom: 24,
          transition: 'border-color .15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
      />
      <ContinueButton onClick={onNext} />
    </>
  )
}

// ─── Screen 4 — Avoid Pills ───────────────────────────────────────────────────

function Screen4({ avoids, toggleAvoid, onNext }: {
  avoids: Set<AvoidOption>
  toggleAvoid: (s: AvoidOption) => void
  onNext: () => void
}) {
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 26,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 8,
        letterSpacing: -0.4,
        textAlign: 'center',
      }}>
        What do you never want to sound like?
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 32,
        textAlign: 'center',
      }}>
        Claude will avoid these when writing for you.
      </p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        {AVOID_OPTIONS.map(s => (
          <PillOption
            key={s}
            label={s}
            selected={avoids.has(s)}
            onToggle={() => toggleAvoid(s)}
          />
        ))}
      </div>
      <ContinueButton onClick={onNext} />
    </>
  )
}

// ─── Screen 5 — Platform Connect ─────────────────────────────────────────────

const PLATFORM_BUTTONS = [
  { id: 'IG', name: 'Instagram', gradient: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)' },
  { id: 'TT', name: 'TikTok', gradient: 'linear-gradient(135deg, #010101, #69C9D0)' },
  { id: 'LI', name: 'LinkedIn', gradient: 'linear-gradient(135deg, #0A66C2, #0077B5)' },
  { id: 'X',  name: 'X',        gradient: 'linear-gradient(135deg, #1a1a1a, #444)' },
]

function Screen5({ onFinish, finishing }: {
  onFinish: (connected: boolean) => void
  finishing: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 26,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 8,
        letterSpacing: -0.4,
        textAlign: 'center',
      }}>
        Want Kontrol to learn from your existing posts?
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        Connect platforms to unlock smarter content suggestions
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 24,
      }}>
        {PLATFORM_BUTTONS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            style={{
              padding: '14px 12px',
              borderRadius: 12,
              border: selected.has(p.id)
                ? '1.5px solid rgba(59,130,246,0.6)'
                : '1.5px solid rgba(255,255,255,0.1)',
              background: selected.has(p.id) ? 'rgba(59,130,246,0.08)' : '#181818',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'border-color .15s, background .15s',
            }}
          >
            <span style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: p.gradient,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#fff',
            }}>
              {p.id}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              color: selected.has(p.id) ? '#fff' : 'rgba(255,255,255,0.7)',
            }}>
              {p.name}
            </span>
          </button>
        ))}
      </div>

      {/* Finish button — only shown when platforms selected */}
      {selected.size > 0 && (
        <button
          type="button"
          onClick={() => onFinish(true)}
          disabled={finishing}
          style={{
            width: '100%',
            padding: '14px 0',
            background: finishing ? 'rgba(59,130,246,0.4)' : '#3B82F6',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 700,
            cursor: finishing ? 'not-allowed' : 'pointer',
            marginBottom: 10,
          }}
        >
          {finishing ? 'Saving...' : 'Finish'}
        </button>
      )}

      {/* Skip — always visible, bigger/prominent */}
      <button
        type="button"
        onClick={() => onFinish(false)}
        disabled={finishing}
        style={{
          width: '100%',
          padding: '14px 0',
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 600,
          cursor: finishing ? 'not-allowed' : 'pointer',
        }}
      >
        Skip for now
      </button>
    </>
  )
}

// ─── Main OnboardingPage ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  // screen 0 = path selection, 1–5 = existing questionnaire screens
  const [screen, setScreen] = useState(0)
  const [selectedPath, setSelectedPath] = useState<SelectedPath>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [styles, setStyles] = useState<Set<StyleOption>>(new Set())
  const [voiceSample, setVoiceSample] = useState('')
  const [avoids, setAvoids] = useState<Set<AvoidOption>>(new Set())
  const [finishing, setFinishing] = useState(false)

  const toggleStyle = (s: StyleOption) => {
    setStyles(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const toggleAvoid = (s: AvoidOption) => {
    setAvoids(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const handleFinish = async (_connected: boolean) => {
    setFinishing(true)
    const parts: string[] = []
    if (styles.size) parts.push(`Style: ${[...styles].join(', ')}`)
    if (voiceSample.trim()) parts.push(`Voice: "${voiceSample.trim()}"`)
    if (avoids.size) parts.push(`Never: ${[...avoids].join(', ')}`)
    const voiceProfile = parts.join('. ')

    try {
      await authApi.updateSettings({ name: name.trim() || user?.name, voiceProfile, onboardingCompleted: true })
    } catch {
      // Best-effort — if backend is offline, still proceed
    }
    updateUser({ name: name.trim() || user?.name ?? '', voiceProfile, onboardingCompleted: true })
    navigate('/', { replace: true })
  }

  const handleSkipNow = async () => {
    setFinishing(true)
    try {
      await authApi.updateSettings({ onboardingCompleted: true })
    } catch {
      // Best-effort
    }
    updateUser({ onboardingCompleted: true })
    navigate('/', { replace: true })
  }

  // Handles the Continue button on Screen 0
  const handlePathContinue = () => {
    if (selectedPath === 'questions') {
      setScreen(1)
    } else if (selectedPath === 'import') {
      setScreen(5)
    } else if (selectedPath === 'skip') {
      handleSkipNow()
    }
  }

  const next = () => setScreen(s => s + 1)

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 24px 48px',
    }}>
      {/* Wordmark */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 16,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 28,
      }}>
        kontrol
      </div>

      <ProgressDots current={screen} total={TOTAL_SCREENS} />

      {/* Content panel */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        {screen === 0 && (
          <Screen0
            selectedPath={selectedPath}
            setSelectedPath={setSelectedPath}
            onContinue={handlePathContinue}
          />
        )}
        {screen === 1 && (
          <Screen1 name={name} setName={setName} onNext={next} />
        )}
        {screen === 2 && (
          <Screen2 styles={styles} toggleStyle={toggleStyle} onNext={next} />
        )}
        {screen === 3 && (
          <Screen3 voiceSample={voiceSample} setVoiceSample={setVoiceSample} onNext={next} />
        )}
        {screen === 4 && (
          <Screen4 avoids={avoids} toggleAvoid={toggleAvoid} onNext={next} />
        )}
        {screen === 5 && (
          <Screen5 onFinish={handleFinish} finishing={finishing} />
        )}
      </div>
    </div>
  )
}

// FRONTEND-AGENT: OnboardingPage complete
