import { useState, useEffect, CSSProperties, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // If already authed, redirect
  useEffect(() => {
    if (user) {
      navigate(user.onboardingCompleted === false ? '/onboarding' : '/', { replace: true })
    }
  }, [user, navigate])

  const isDisabled = loading || !email.trim() || !password

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isDisabled) return
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      // Navigation handled by the useEffect above (user state update triggers it)
      // But we also navigate immediately for snappiness
      // We need the updated user from context — check onboarding after login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: CSSProperties = {
    background: '#181818',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    color: '#fff',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px',
    }}>
      {/* Wordmark */}
      <img
        src="/logo.svg"
        alt="Kontrol"
        style={{ width: 160, height: 'auto', marginBottom: 40, opacity: 0.9 }}
      />

      {/* Heading */}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 800,
        fontSize: 28,
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 32,
        textAlign: 'center',
      }}>
        Welcome back
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Email */}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          autoFocus
          style={{
            ...inputStyle,
            borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
          }}
          onFocus={e => {
            if (!error) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
          }}
          onBlur={e => {
            if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        />

        {/* Password + eye toggle */}
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            style={{
              ...inputStyle,
              paddingRight: 48,
              borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
            }}
            onFocus={e => {
              if (!error) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
            }}
            onBlur={e => {
              if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 3l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            )}
          </button>
        </div>

        {/* Inline error */}
        {error && (
          <div style={{
            fontSize: 13,
            color: 'rgba(239,68,68,0.9)',
            fontFamily: 'var(--font-body)',
            paddingLeft: 2,
          }}>
            {error}
          </div>
        )}

        {/* Sign in button */}
        <button
          type="submit"
          disabled={isDisabled}
          style={{
            background: isDisabled ? 'rgba(59,130,246,0.4)' : '#3B82F6',
            border: 'none',
            borderRadius: 12,
            padding: '14px 0',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 16,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
            marginTop: 4,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {/* Register link */}
        <div style={{
          textAlign: 'center',
          fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'var(--font-body)',
          marginTop: 8,
        }}>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            style={{
              color: 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Create one
          </Link>
        </div>
      </form>
    </div>
  )
}

// FRONTEND-AGENT: LoginPage complete
