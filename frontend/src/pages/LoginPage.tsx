import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(password)
      login({
        token: res.token,
        name: res.user.name,
        email: res.user.email,
        voiceProfile: res.user.voiceProfile,
      })
      navigate('/', { replace: true })
    } catch {
      setError('Wrong password.')
    } finally {
      setLoading(false)
    }
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
      {/* Logo */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: 22,
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 48,
      }}>
        kontrol
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="password"
          autoFocus
          style={{
            background: '#181818',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12,
            padding: '14px 16px',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            transition: 'border-color .15s',
          }}
          onFocus={e => {
            if (!error) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
          }}
          onBlur={e => {
            if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        />

        {error && (
          <div style={{
            fontSize: 12,
            color: 'rgba(239,68,68,0.85)',
            fontFamily: 'var(--font-body)',
            paddingLeft: 2,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            background: loading || !password ? 'rgba(59,130,246,0.4)' : '#3B82F6',
            border: 'none',
            borderRadius: 12,
            padding: '14px 0',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 15,
            cursor: loading || !password ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
          }}
        >
          {loading ? 'Checking...' : 'Enter Kontrol'}
        </button>
      </form>
    </div>
  )
}

// FRONTEND-AGENT: LoginPage complete
