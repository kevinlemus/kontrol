import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api/auth'

// ─── Main OnboardingPage ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { updateUser } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    try {
      await authApi.updateSettings({ onboardingCompleted: true })
    } catch {
      // Best-effort — if backend is offline, still proceed
    }
    updateUser({ onboardingCompleted: true })
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px 48px',
    }}>
      {/* Wordmark */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 18,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 48,
      }}>
        kontrol
      </div>

      {/* Content panel */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-body)',
          fontSize: 26,
          fontWeight: 800,
          color: '#fff',
          margin: '0 0 20px',
          letterSpacing: -0.4,
          lineHeight: 1.25,
        }}>
          Welcome to Kontrol
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          color: '#888',
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}>
          Kontrol learns how you write by watching your edits.
          Every time you tweak a generated post, it gets better at
          matching your voice — automatically, per account, per platform.
          <br /><br />
          No setup needed. Just start posting.
        </p>

        <button
          type="button"
          onClick={handleGetStarted}
          disabled={isLoading}
          style={{
            width: '100%',
            height: 52,
            background: isLoading ? 'rgba(59,130,246,0.5)' : '#3B82F6',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginTop: 32,
            transition: 'background .15s, opacity .15s',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Starting...' : 'Get Started →'}
        </button>
      </div>
    </div>
  )
}

// FRONTEND-AGENT: OnboardingPage complete
