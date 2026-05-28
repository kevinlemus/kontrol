export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function showLocalNotification(title: string, body: string, url?: string) {
  if (Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body,
    icon: '/icon-512.png',
    badge: '/favicon-32x32.png',
    tag: 'kontrol',
  })
  if (url) n.onclick = () => window.open(url, '_blank')
}
