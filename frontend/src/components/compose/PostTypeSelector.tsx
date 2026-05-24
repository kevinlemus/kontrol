import React from 'react'
import { PlatformId, PostType, PLATFORM_POST_TYPES } from './types'

interface Props {
  platformId: PlatformId
  selected: PostType
  onChange: (type: PostType) => void
}

export function PostTypeSelector({ platformId, selected, onChange }: Props) {
  const postTypes = PLATFORM_POST_TYPES[platformId]

  if (!postTypes) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 16,
    }}>
      {postTypes.map(type => {
        const isSelected = type === selected
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            style={{
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
              cursor: 'pointer',
              border: 'none',
              fontWeight: isSelected ? 700 : 400,
              background: isSelected ? '#FFFFFF' : 'transparent',
              color: isSelected ? '#000000' : 'rgba(255,255,255,0.6)',
              ...(isSelected ? {} : { border: '1px solid rgba(255,255,255,0.25)' }),
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        )
      })}
    </div>
  )
}
