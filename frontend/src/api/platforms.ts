import type { PlatformId } from '../components/compose/types'

// Mirrors INITIAL_PLATFORM_ACCOUNTS from SettingsPage.tsx
// Temporary until OAuth is wired up — only 'connected' platforms are shown in Compose
const PLATFORM_CONNECTION_STATUS: { key: PlatformId; status: 'connected' | 'pending' | 'not_connected' }[] = [
  { key: 'IG', status: 'connected' },
  { key: 'TT', status: 'pending' },
  { key: 'LI', status: 'not_connected' },
  { key: 'RD', status: 'connected' },
  { key: 'X',  status: 'not_connected' },
  { key: 'FB', status: 'not_connected' },
  { key: 'YT', status: 'not_connected' },
  { key: 'ST', status: 'pending' },
  { key: 'IT', status: 'connected' },
  { key: 'GJ', status: 'not_connected' },
]

/**
 * Returns platform IDs that have a confirmed OAuth connection.
 * Pending platforms are excluded — they haven't completed auth yet.
 * Replace this function body once real OAuth tokens are stored.
 */
export function getConnectedPlatforms(): PlatformId[] {
  return PLATFORM_CONNECTION_STATUS
    .filter(p => p.status === 'connected')
    .map(p => p.key)
}
