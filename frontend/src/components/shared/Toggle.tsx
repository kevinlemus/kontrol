interface ToggleProps {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        background: checked ? 'var(--accent-green)' : 'var(--bg-active)',
        position: 'relative',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s ease',
        opacity: disabled ? 0.4 : 1,
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: checked ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s ease',
        display: 'block',
      }} />
    </button>
  )
}
