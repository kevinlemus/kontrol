import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'white',
          background: '#000',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ color: '#3B82F6', marginBottom: 16 }}>Something went wrong</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
