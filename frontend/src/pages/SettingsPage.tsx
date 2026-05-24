import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/shared/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformKey = 'IG' | 'TT' | 'LI' | 'RD' | 'X' | 'FB' | 'YT' | 'ST' | 'IT' | 'GJ'
type ConnectStatus = 'connected' | 'pending' | 'not_connected'

interface PlatformAccount {
  key: PlatformKey
  name: string
  gradient: string
  status: ConnectStatus
  account?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_PLATFORM_ACCOUNTS: PlatformAccount[] = [
  { key: 'IG', name: 'Instagram', gradient: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)', status: 'connected',     account: '@kontrol_ig' },
  { key: 'TT', name: 'TikTok',    gradient: 'linear-gradient(135deg, #010101, #69C9D0)',          status: 'pending' },
  { key: 'LI', name: 'LinkedIn',  gradient: 'linear-gradient(135deg, #0A66C2, #0077B5)',          status: 'not_connected' },
  { key: 'RD', name: 'Reddit',    gradient: 'linear-gradient(135deg, #FF4500, #FF6534)',          status: 'connected',     account: 'u/kevin_dev' },
  { key: 'X',  name: 'X',        gradient: 'linear-gradient(135deg, #1a1a1a, #333333)',          status: 'not_connected' },
  { key: 'FB', name: 'Facebook',  gradient: 'linear-gradient(135deg, #1877F2, #0C5FCF)',          status: 'not_connected' },
  { key: 'YT', name: 'YouTube',   gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',          status: 'not_connected' },
  { key: 'ST', name: 'Steam',     gradient: 'linear-gradient(135deg, #1B2838, #2A475E)',          status: 'pending' },
  { key: 'IT', name: 'itch.io',   gradient: 'linear-gradient(135deg, #FA5C5C, #E63946)',          status: 'connected',     account: 'kontrol' },
  { key: 'GJ', name: 'Game Jolt', gradient: 'linear-gradient(135deg, #2F7F3E, #45B069)',          status: 'not_connected' },
]

// ─── Platform env var map ─────────────────────────────────────────────────────

const PLATFORM_ENV_VARS: Record<PlatformKey, string[]> = {
  IG: ['META_APP_ID', 'META_APP_SECRET'],
  FB: ['META_APP_ID', 'META_APP_SECRET'],
  TT: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
  LI: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  RD: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
  X:  ['TWITTER_API_KEY', 'TWITTER_API_SECRET'],
  YT: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
  ST: ['STEAM_PARTNER_KEY'],
  IT: ['ITCHIO_API_KEY'],
  GJ: ['GAMEJOLT_API_KEY'],
}

// ─── OAuthModal ───────────────────────────────────────────────────────────────

function OAuthModal({ platform, onClose }: { platform: PlatformAccount; onClose: () => void }) {
  const envVars = PLATFORM_ENV_VARS[platform.key] ?? []

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
        }}
      >
        {/* Panel */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: 400,
            width: '100%',
            background: 'var(--bg-card)',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            animation: 'modalIn 200ms ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {/* Platform swatch */}
            <span style={{
              width: 40, height: 40, borderRadius: 10,
              background: platform.gradient,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)',
            }}>
              {platform.key}
            </span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                Connect {platform.name}
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: 4,
                padding: '2px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
              }}>
                OAuth 2.0
              </span>
            </div>
          </div>

          {/* Body */}
          <p style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            margin: '0 0 14px',
          }}>
            Connect your {platform.name} account to enable publishing directly from Kontrol.
          </p>
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            margin: '0 0 14px',
          }}>
            To enable: add the following to your backend <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: 4 }}>.env</span> file and restart the server.
          </p>

          {/* Env vars */}
          <div style={{
            background: 'var(--bg-raised)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            {envVars.map(v => (
              <span
                key={v}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  background: 'var(--bg-raised)',
                  color: 'var(--text-secondary)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  display: 'inline-block',
                  letterSpacing: 0.3,
                }}
              >
                {v}
              </span>
            ))}
          </div>

          {/* Got it button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'var(--bg-raised)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: 999,
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title, subtitle, danger = false,
}: {
  title: string
  subtitle?: string
  danger?: boolean
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 16, fontWeight: 700,
        color: danger ? '#EF4444' : 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        marginBottom: subtitle ? 4 : 0,
      }}>
        {title}
      </div>
      {subtitle && (
        <p style={{
          fontSize: 12, color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)', lineHeight: 1.5, margin: 0,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ─── Platform Row (stateful per row) ──────────────────────────────────────────

function PlatformRow({
  platform, onDisconnect, onOpenModal,
}: {
  platform: PlatformAccount
  onDisconnect: (key: PlatformKey) => void
  onOpenModal: (platform: PlatformAccount) => void
}) {
  const { showToast } = useToast()
  const [connectHovered, setConnectHovered] = useState(false)
  const [disconnectConfirm, setDisconnectConfirm] = useState(false)
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDisconnectClick = () => {
    if (!disconnectConfirm) {
      setDisconnectConfirm(true)
      disconnectTimerRef.current = setTimeout(() => setDisconnectConfirm(false), 3000)
      return
    }
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
    setDisconnectConfirm(false)
    onDisconnect(platform.key)
    showToast(`${platform.name} disconnected`)
  }

  const renderStatus = () => {
    if (platform.status === 'connected') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1ED760', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {platform.account}
            </span>
          </span>
          {/* Disconnect button */}
          <button
            onClick={handleDisconnectClick}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              border: disconnectConfirm ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.08)',
              background: disconnectConfirm ? 'rgba(239,68,68,0.1)' : 'none',
              color: disconnectConfirm ? '#EF4444' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color .15s, border-color .15s, background .15s',
              whiteSpace: 'nowrap',
            }}
          >
            {disconnectConfirm ? 'Confirm disconnect?' : 'Disconnect'}
          </button>
        </div>
      )
    }

    if (platform.status === 'pending') {
      const link = platform.key === 'TT'
        ? 'Apply at TikTok for Developers →'
        : 'Apply at Steamworks →'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>Pending approval</span>
          </span>
          <span style={{
            fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', cursor: 'pointer',
          }}>
            {link}
          </span>
        </div>
      )
    }

    // not_connected
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>—</span>
        </span>
        <button
          onClick={() => onOpenModal(platform)}
          onMouseEnter={() => setConnectHovered(true)}
          onMouseLeave={() => setConnectHovered(false)}
          style={{
            padding: '4px 12px',
            borderRadius: 999,
            border: `1px solid ${connectHovered ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
            background: 'none',
            color: connectHovered ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          Connect
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Gradient swatch */}
      <span style={{
        width: 40, height: 40, borderRadius: 10,
        background: platform.gradient,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 700, color: '#fff',
        fontFamily: 'var(--font-body)',
      }}>
        {platform.key}
      </span>

      {/* Platform name */}
      <span style={{
        flex: 1,
        fontSize: 15, fontWeight: 600,
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}>
        {platform.name}
      </span>

      {/* Status */}
      {renderStatus()}
    </div>
  )
}

// ─── Change Password Form ─────────────────────────────────────────────────────

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-active)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    outline: 'none',
    marginBottom: 10,
    boxSizing: 'border-box',
  }

  const handleSave = () => {
    if (!newPw || !confirmPw) {
      setError('Please fill in all fields')
      return
    }
    if (newPw !== confirmPw) {
      setError('New passwords do not match')
      return
    }
    setError('')
    localStorage.setItem('kontrol_pw_changed', JSON.stringify({ changedAt: new Date().toISOString() }))
    showToast('Password updated (mock — connect backend to activate)')
    onClose()
  }

  const handleCancel = () => {
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setError('')
    onClose()
  }

  return (
    <div style={{
      marginTop: 14,
      paddingTop: 14,
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <input
        type="password"
        placeholder="Current password"
        value={currentPw}
        onChange={e => setCurrentPw(e.target.value)}
        style={inputStyle}
        autoComplete="current-password"
      />
      <input
        type="password"
        placeholder="New password"
        value={newPw}
        onChange={e => setNewPw(e.target.value)}
        style={inputStyle}
        autoComplete="new-password"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPw}
        onChange={e => setConfirmPw(e.target.value)}
        style={{ ...inputStyle, marginBottom: 0 }}
        autoComplete="new-password"
      />
      {error && (
        <div style={{
          fontSize: 12, color: '#EF4444', fontFamily: 'var(--font-body)',
          marginTop: 8, marginBottom: 4,
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'none',
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
  )
}

// ─── Back Button ──────────────────────────────────────────────────────────────

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer',
        padding: '4px 0',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back
    </button>
  )
}

// ─── Page Header (Settings-specific) ──────────────────────────────────────────

function SettingsHeader({ onBack }: { onBack: () => void }) {
  return (
    <header style={{
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      flexShrink: 0,
      background: 'var(--bg-base)',
    }}>
      <BackButton onBack={onBack} />
      <span style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-body)',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: -0.2,
      }}>
        Settings
      </span>
      <div style={{ width: 40 }} />
    </header>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [platforms, setPlatforms] = useState<PlatformAccount[]>(INITIAL_PLATFORM_ACCOUNTS)
  const [oauthModal, setOauthModal] = useState<PlatformAccount | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDisconnect = (key: PlatformKey) => {
    setPlatforms(ps => ps.map(p =>
      p.key === key ? { ...p, status: 'not_connected' as const, account: undefined } : p
    ))
  }

  const handleResetConfirm = () => {
    localStorage.clear()
    showToast('All data cleared')
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      navigate('/')
    }, 1000)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <SettingsHeader onBack={() => navigate(-1)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 48px' }}>

        {/* ── Section 1: Platform Accounts ── */}
        <div style={{ marginBottom: 36 }}>
          <SectionHeader
            title="Platform Accounts"
            subtitle="These credentials are shared across all projects unless a project overrides them."
          />
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-card)',
            padding: '0 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            {platforms.map((p, i) => (
              <div key={p.key} style={{
                borderBottom: i < platforms.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <PlatformRow
                  platform={p}
                  onDisconnect={handleDisconnect}
                  onOpenModal={setOauthModal}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: Access ── */}
        <div style={{ marginBottom: 36 }}>
          <SectionHeader title="Access" />
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-card)',
            padding: '14px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                Change password
              </span>
              <button
                onClick={() => setShowPasswordForm(s => !s)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-button)',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'none',
                  color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {showPasswordForm ? 'Cancel' : 'Update →'}
              </button>
            </div>
            <p style={{
              fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
              lineHeight: 1.5, margin: '8px 0 0',
            }}>
              Kontrol is solo use only — password protects local access.
            </p>

            {showPasswordForm && (
              <ChangePasswordForm onClose={() => setShowPasswordForm(false)} />
            )}
          </div>
        </div>

        {/* ── Section 3: Danger Zone ── */}
        <div>
          <SectionHeader title="Danger Zone" danger />
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'rgba(239,68,68,0.25)',
          }}>
            {!showResetConfirm ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                    Reset all data
                  </div>
                  <p style={{
                    fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                    lineHeight: 1.5, margin: 0,
                  }}>
                    Clears all posts, suggestions, and settings. Projects and platform connections are removed.
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: '1px solid rgba(239,68,68,0.45)',
                    background: 'none',
                    color: '#EF4444',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Reset Everything
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{
                  fontSize: 14, color: '#EF4444', fontFamily: 'var(--font-body)',
                  fontWeight: 700, margin: 0,
                }}>
                  Are you sure? This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleResetConfirm}
                    style={{
                      padding: '8px 18px', borderRadius: 999,
                      background: '#EF4444', color: '#fff', border: 'none',
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    Yes, reset everything
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    style={{
                      padding: '8px 18px', borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.12)', background: 'none',
                      color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                      fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Version info */}
        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            kontrol v0.1.0 — sprint 2
          </span>
        </div>
      </div>

      {/* OAuth Modal */}
      {oauthModal && (
        <OAuthModal platform={oauthModal} onClose={() => setOauthModal(null)} />
      )}
    </div>
  )
}

// FRONTEND-AGENT: SettingsPage complete (Task B + Task C)
