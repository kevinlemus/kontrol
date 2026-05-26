import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required'
    if (!email.includes('@')) return 'Enter a valid email'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const isDisabled = loading || !name.trim() || !email.trim() || !password || !confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(name.trim(), email.trim(), password)
      // register() persists the token + sets state before returning.
      // Navigate directly — no need to wait for a useEffect on user state.
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
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
        Create your account
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          autoComplete="name"
          autoFocus
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Email */}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Password */}
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            style={{ ...inputStyle, paddingRight: 48 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
              {showPassword && <path d="M3 3l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>

        {/* Confirm password */}
        <div style={{ position: 'relative' }}>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            style={{ ...inputStyle, paddingRight: 48 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(s => !s)}
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
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
              {showConfirm && <path d="M3 3l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
            </svg>
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

        {/* Submit button */}
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        {/* Sign in link */}
        <div style={{
          textAlign: 'center',
          fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'var(--font-body)',
          marginTop: 8,
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  )
}

// FRONTEND-AGENT: RegisterPage complete
