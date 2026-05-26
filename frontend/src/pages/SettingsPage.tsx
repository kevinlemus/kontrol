import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/shared/Toast'
import { useAuth } from '../contexts/AuthContext'
import { authApi, uploadAvatar } from '../api/auth'
import { projectsApi } from '../api/projects'
import { connectionsApi, type ConnectionStatus } from '../api/connections'

// ─── Constants ─────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const PLATFORM_EMOJI: Record<string, string> = {
  IG: '📸', TT: '🎵', LI: '💼', RD: '🔴', X: '✕',
  FB: '👥', YT: '▶️', ST: '🎮', IT: '🎲', GJ: '🎯',
}
const PLATFORM_NAME: Record<string, string> = {
  IG: 'Instagram', TT: 'TikTok', LI: 'LinkedIn', RD: 'Reddit', X: 'X',
  FB: 'Facebook', YT: 'YouTube', ST: 'Steam', IT: 'itch.io', GJ: 'Game Jolt',
}

// Map platform key to the backend OAuth authorize path segment
const PLATFORM_OAUTH_PATH: Record<string, string> = {
  IG: 'instagram',
  TT: 'tiktok',
  LI: 'linkedin',
  RD: 'reddit',
  X:  'twitter',
  FB: 'facebook',
  YT: 'youtube',
  ST: 'steam',
  IT: 'itchio',
  GJ: 'gamejolt',
}

// Platforms with working OAuth credentials + backend implementation
const OAUTH_IMPLEMENTED = new Set(['IG', 'FB', 'LI'])

function readVoiceEdits(): Record<string, number> {
  try {
    const raw = localStorage.getItem('kontrol_voice_edits')
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, number>
    }
    return {}
  } catch {
    return {}
  }
}

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
  { key: 'IG', name: 'Instagram', gradient: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)', status: 'not_connected' },
  { key: 'TT', name: 'TikTok',    gradient: 'linear-gradient(135deg, #010101, #69C9D0)',          status: 'pending' },
  { key: 'LI', name: 'LinkedIn',  gradient: 'linear-gradient(135deg, #0A66C2, #0077B5)',          status: 'not_connected' },
  { key: 'RD', name: 'Reddit',    gradient: 'linear-gradient(135deg, #FF4500, #FF6534)',          status: 'pending' },
  { key: 'X',  name: 'X',        gradient: 'linear-gradient(135deg, #1a1a1a, #333333)',          status: 'not_connected' },
  { key: 'FB', name: 'Facebook',  gradient: 'linear-gradient(135deg, #1877F2, #0C5FCF)',          status: 'not_connected' },
  { key: 'YT', name: 'YouTube',   gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',          status: 'not_connected' },
  { key: 'ST', name: 'Steam',     gradient: 'linear-gradient(135deg, #1B2838, #2A475E)',          status: 'pending' },
  { key: 'IT', name: 'itch.io',   gradient: 'linear-gradient(135deg, #FA5C5C, #E63946)',          status: 'not_connected' },
  { key: 'GJ', name: 'Game Jolt', gradient: 'linear-gradient(135deg, #2F7F3E, #45B069)',          status: 'not_connected' },
]

// ─── ConnectModal ─────────────────────────────────────────────────────────────
// Clean modal — no .env instructions, no variable names

function ConnectModal({ platform, projectId, onClose }: {
  platform: PlatformAccount
  projectId: string | null
  onClose: () => void
}) {
  const oauthPath = PLATFORM_OAUTH_PATH[platform.key] ?? platform.key.toLowerCase()
  const authorizeUrl = `${BASE}/api/v1/oauth/${oauthPath}/authorize${projectId ? `?project_id=${projectId}` : ''}`

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
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
        <div
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: 380,
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
            margin: '0 0 20px',
          }}>
            Connect your {platform.name} account to publish directly from Kontrol.
          </p>

          {/* Not configured state */}
          {!authorizeUrl ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 13, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}>
                  Not connected — coming soon
                </span>
              </div>
            </div>
          ) : (
            <a
              href={authorizeUrl}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 0',
                background: '#3B82F6',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'none',
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            >
              Connect {platform.name} →
            </a>
          )}

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
            Cancel
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
  platform, onDisconnect, onOpenModal, isImplemented,
}: {
  platform: PlatformAccount
  onDisconnect: (key: PlatformKey) => void
  onOpenModal: (platform: PlatformAccount) => void
  isImplemented: boolean
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
        {isImplemented ? (
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
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
            coming soon
          </span>
        )}
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

      <span style={{
        flex: 1,
        fontSize: 15, fontWeight: 600,
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}>
        {platform.name}
      </span>

      {renderStatus()}
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
      minHeight: 'calc(52px + max(env(safe-area-inset-top), 44px))',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '0 16px',
      paddingTop: 'max(env(safe-area-inset-top), 44px)',
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

// ─── Avatar component ─────────────────────────────────────────────────────────

function Avatar({
  avatarUrl,
  name,
  size,
  onClick,
}: {
  avatarUrl?: string
  name: string
  size: number
  onClick?: () => void
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: avatarUrl ? 'transparent' : '#3B82F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{
          fontSize: size * 0.42,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'var(--font-body)',
          lineHeight: 1,
        }}>
          {initial}
        </span>
      )}
    </div>
  )
}

// ─── My Profile Section ───────────────────────────────────────────────────────

function MyProfileSection() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Name editing
  const [name, setName] = useState(user?.name ?? '')
  const [nameDirty, setNameDirty] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)

  // Email editing
  const [email, setEmail] = useState(user?.email ?? '')
  const [emailDirty, setEmailDirty] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailCurrentPw, setEmailCurrentPw] = useState('')
  const [emailModalError, setEmailModalError] = useState('')
  const [emailModalSaving, setEmailModalSaving] = useState(false)

  // Password change
  const [showPwForm, setShowPwForm] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwOk, setPwOk] = useState(false)

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    outline: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    padding: '8px 0',
  }

  const fieldInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const saveBtnStyle = (dirty: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 10,
    border: dirty ? 'none' : '1px solid rgba(255,255,255,0.12)',
    background: dirty ? '#3B82F6' : 'none',
    color: dirty ? '#fff' : 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 700,
    cursor: dirty ? 'pointer' : 'default',
    flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
  })

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { avatarUrl } = await uploadAvatar(file)
      updateUser({ avatarUrl })
      showToast('Avatar updated')
    } catch {
      showToast('Avatar upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSaveName = async () => {
    if (!nameDirty || nameSaving) return
    setNameSaving(true)
    try {
      await authApi.updateSettings({ name })
      updateUser({ name })
      setNameDirty(false)
      showToast('Name saved ✓')
    } catch {
      showToast('Failed to save name')
    } finally {
      setNameSaving(false)
    }
  }

  const handleConfirmEmailChange = async () => {
    setEmailModalSaving(true)
    setEmailModalError('')
    try {
      await authApi.updateSettings({ email, currentPassword: emailCurrentPw })
      updateUser({ email })
      setShowEmailModal(false)
      setEmailDirty(false)
      setEmailCurrentPw('')
      showToast('Email saved ✓')
    } catch {
      setEmailModalError('Wrong password or save failed')
    } finally {
      setEmailModalSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwOk(false)
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPw.length < 8) { setPwError('Must be at least 8 characters'); return }
    setPwSaving(true)
    try {
      const res = await authApi.changePassword(currentPw, newPw)
      if (res.error) { setPwError(res.error); return }
      setPwOk(true)
      showToast('Password updated ✓')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwOk(false); setShowPwForm(false) }, 2000)
    } catch {
      setPwError('Failed to update password')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section label */}
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4,
      }}>
        My Profile
      </div>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* Avatar + name row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              avatarUrl={user?.avatarUrl}
              name={user?.name ?? '?'}
              size={80}
              onClick={handleAvatarClick}
            />
            {/* Upload indicator */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#3B82F6',
              border: '2px solid var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
              onClick={handleAvatarClick}
            >
              {uploading ? (
                <span style={{ fontSize: 9, color: '#fff' }}>...</span>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2v6M2 5h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.name ?? 'Your name'}
            </div>
            {user?.email && (
              <div style={{
                fontSize: 12, color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginTop: 2,
              }}>
                {user.email}
              </div>
            )}
          </div>
        </div>

        {/* Name field */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Name
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameDirty(true) }}
              onBlur={handleSaveName}
              placeholder="Your name"
              style={inputStyle}
            />
            <button
              onClick={handleSaveName}
              style={saveBtnStyle(nameDirty && !nameSaving)}
            >
              {nameSaving ? '...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Email field */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Email
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailDirty(true) }}
              placeholder="your@email.com"
              style={inputStyle}
            />
            <button
              onClick={() => { if (!emailDirty) return; setEmailModalError(''); setShowEmailModal(true) }}
              style={saveBtnStyle(emailDirty)}
            >
              Save
            </button>
          </div>
        </div>

        {/* Email change modal */}
        {showEmailModal && (
          <>
            <style>{`
              @keyframes emailModalIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
              }
            `}</style>
            <div
              onClick={() => { setShowEmailModal(false); setEmailCurrentPw(''); setEmailModalError('') }}
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
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  maxWidth: 380,
                  width: '100%',
                  background: 'var(--bg-card)',
                  borderRadius: 20,
                  padding: '28px 24px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                  animation: 'emailModalIn 200ms ease-out',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                  Confirm email change
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-all',
                }}>
                  {email}
                </div>
                <input
                  type="password"
                  value={emailCurrentPw}
                  onChange={e => setEmailCurrentPw(e.target.value)}
                  placeholder="Current password"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '14px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleConfirmEmailChange() }}
                />
                {emailModalError && (
                  <span style={{ fontSize: 12, color: '#EF4444', fontFamily: 'var(--font-body)', marginTop: -8 }}>
                    {emailModalError}
                  </span>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleConfirmEmailChange}
                    disabled={emailModalSaving}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      background: '#3B82F6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 999,
                      fontFamily: 'var(--font-body)',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: emailModalSaving ? 'not-allowed' : 'pointer',
                      opacity: emailModalSaving ? 0.6 : 1,
                    }}
                  >
                    {emailModalSaving ? 'Saving...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => { setShowEmailModal(false); setEmailCurrentPw(''); setEmailModalError('') }}
                    style={{
                      flex: 1,
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
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Password change */}
        <div style={{ padding: '14px 18px' }}>
          {!showPwForm ? (
            <button
              onClick={() => setShowPwForm(true)}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Change password →
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2,
              }}>
                Change Password
              </div>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="Current password"
                style={fieldInputStyle}
              />
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="New password"
                style={fieldInputStyle}
              />
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                style={fieldInputStyle}
              />
              {pwError && (
                <span style={{ fontSize: 11, color: '#EF4444', fontFamily: 'var(--font-body)' }}>{pwError}</span>
              )}
              {pwOk && (
                <span style={{ fontSize: 11, color: '#1ED760', fontFamily: 'var(--font-body)' }}>Password updated</span>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  style={{
                    background: '#3B82F6', border: 'none', borderRadius: 10,
                    padding: '10px 18px', color: '#fff',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                    cursor: pwSaving ? 'not-allowed' : 'pointer',
                    opacity: pwSaving ? 0.6 : 1,
                  }}
                >
                  {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  onClick={() => { setShowPwForm(false); setPwError(''); setCurrentPw(''); setNewPw(''); setConfirmPw('') }}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10,
                    padding: '10px 16px', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()

  // Voice edits state — read from localStorage, refresh on focus
  const [voiceEdits, setVoiceEdits] = useState<Record<string, number>>(readVoiceEdits)
  useEffect(() => {
    function onFocus() { setVoiceEdits(readVoiceEdits()) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Platform/reset state
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [connectModal, setConnectModal] = useState<PlatformAccount | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Real connection statuses from API
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([])

  // Get current project ID for OAuth flows — fetch from API
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  useEffect(() => {
    projectsApi.list()
      .then(list => {
        const active = list.find(p => p.active)
        setActiveProjectId(active?.id ?? null)
      })
      .catch(() => {})
  }, [])

  // Handle OAuth redirect params — run once on mount
  useEffect(() => {
    const connected = searchParams.get('connected')
    const errorParam = searchParams.get('error')
    if (connected) showToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected ✓`)
    if (errorParam === 'not_configured') showToast(`Platform not configured — check env vars`)
    else if (errorParam) showToast(`Connection failed: ${errorParam}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — only run once on mount

  // Fetch real connection statuses whenever activeProjectId changes
  useEffect(() => {
    connectionsApi.list(activeProjectId ?? undefined)
      .then(setConnectionStatuses)
      .catch(() => {})
  }, [activeProjectId])

  // Helpers to look up real connection status
  function getConnectionStatus(key: PlatformKey): ConnectStatus {
    if (connectionStatuses.length === 0) {
      // API offline — never assume connected; keep pending statuses only
      const initial = INITIAL_PLATFORM_ACCOUNTS.find(p => p.key === key)
      return initial?.status === 'pending' ? 'pending' : 'not_connected'
    }
    const found = connectionStatuses.find(c => c.platform === key)
    if (!found || !found.connected) return 'not_connected'
    return 'connected'
  }
  function getAccountHandle(key: PlatformKey): string | undefined {
    const found = connectionStatuses.find(c => c.platform === key)
    return found?.accountHandle ?? undefined
  }

  // Derive platforms from INITIAL_PLATFORM_ACCOUNTS, overlaying real statuses
  const platforms = INITIAL_PLATFORM_ACCOUNTS.map(p => ({
    ...p,
    status: (p.status === 'pending' ? 'pending' : getConnectionStatus(p.key)) as ConnectStatus,
    account: p.status === 'pending' ? p.account : getAccountHandle(p.key),
  }))

  const handleDisconnect = (key: PlatformKey) => {
    connectionsApi.disconnect(key, activeProjectId ?? undefined)
      .then(() => {
        connectionsApi.list(activeProjectId ?? undefined)
          .then(setConnectionStatuses)
          .catch(() => {})
      })
      .catch(() => {})
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 80px' }}>

        {/* ── Section 0: My Profile ── */}
        <MyProfileSection />

        {/* ── Section 1: Your Voice Profile ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4,
          }}>
            Your Voice Profile
          </div>
          <div style={{
            background: '#181818',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 14px',
          }}>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: '#fff',
              fontFamily: 'var(--font-body)',
              marginBottom: 10,
            }}>
              Your Voice Profile
            </div>
            <p style={{
              fontSize: 14,
              color: '#888',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.5,
              margin: '0 0 14px',
            }}>
              Kontrol builds your voice profile automatically by learning
              from every edit you make to generated posts.
            </p>

            {(() => {
              const trackedPlatforms = Object.entries(voiceEdits).filter(([, count]) => count > 0)
              if (trackedPlatforms.length === 0) {
                return (
                  <div style={{
                    fontSize: 13,
                    color: '#888',
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                  }}>
                    No edits tracked yet — start by generating and editing your first post.
                  </div>
                )
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {trackedPlatforms.map(([code, count]) => (
                    <div
                      key={code}
                      style={{
                        background: '#222',
                        borderRadius: 10,
                        padding: '10px 14px',
                        margin: '6px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{PLATFORM_EMOJI[code] ?? '🔗'}</span>
                      <span style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#fff',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                      }}>
                        {PLATFORM_NAME[code] ?? code}
                      </span>
                      <span style={{
                        fontSize: 13,
                        color: '#888',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {count} {count === 1 ? 'edit' : 'edits'} learned
                      </span>
                    </div>
                  ))}
                </div>
              )
            })()}

            <p style={{
              fontSize: 12,
              color: '#888',
              fontFamily: 'var(--font-body)',
              margin: '12px 0 0',
            }}>
              Connect accounts in Projects to start learning faster.
            </p>
          </div>
        </div>

        {/* ── Section 2: Platform Accounts ── */}
        <div style={{ marginBottom: 36 }}>
          <SectionHeader
            title="Platform Accounts"
            subtitle="Connect your accounts to enable publishing from Kontrol."
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
                  onOpenModal={setConnectModal}
                  isImplemented={OAUTH_IMPLEMENTED.has(p.key)}
                />
              </div>
            ))}
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

      {/* Connect Modal */}
      {connectModal && (
        <ConnectModal
          platform={connectModal}
          projectId={activeProjectId}
          onClose={() => setConnectModal(null)}
        />
      )}
    </div>
  )
}

// FRONTEND-AGENT: SettingsPage complete (Issues 1, 3, 4)
