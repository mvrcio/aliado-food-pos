import { supabase } from './supabase'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
const OFF = 'aliado-notif-off'

export type PushState = 'unsupported' | 'denied' | 'on' | 'off'

export const notificationsSupported = () => 'Notification' in window && 'serviceWorker' in navigator
export const pushServerConfigured = () => !!VAPID && 'PushManager' in window
const userOff = () => { try { return localStorage.getItem(OFF) === '1' } catch { return false } }
const setUserOff = (v: boolean) => { try { if (v) localStorage.setItem(OFF, '1'); else localStorage.removeItem(OFF) } catch { /* ignora */ } }

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try { return await navigator.serviceWorker.register('/sw.js') } catch { return null }
}

function toKey(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export function notificationState(): PushState {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.permission === 'granted' && !userOff() ? 'on' : 'off'
}

/** O aparelho está registado para receber push (com a app fechada)? */
export async function deviceSubscribed() {
  try { return !!(await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription()) } catch { return false }
}

/** Pede autorização e, se o servidor de push estiver configurado (chave VAPID), regista o aparelho. */
export async function enableNotifications(): Promise<PushState> {
  if (!notificationsSupported()) return 'unsupported'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'
  setUserOff(false)
  await registerSW()
  if (pushServerConfigured()) {
    try {
      const ready = await navigator.serviceWorker.ready
      const sub = (await ready.pushManager.getSubscription())
        ?? (await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID!) as BufferSource }))
      const j = sub.toJSON()
      await supabase.rpc('save_push_subscription', { p_endpoint: j.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth })
    } catch { /* os avisos com a app aberta continuam a funcionar */ }
  }
  return 'on'
}

export async function disableNotifications(): Promise<PushState> {
  setUserOff(true)
  try {
    const sub = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription()
    if (sub) { await supabase.rpc('remove_push_subscription', { p_endpoint: sub.endpoint }); await sub.unsubscribe() }
  } catch { /* ignora */ }
  return notificationState()
}

const opts = (body: string, tag?: string): NotificationOptions & { vibrate?: number[]; actions?: { action: string; title: string }[] } => ({
  body, icon: '/icon-192.png', badge: '/badge-96.png', tag, vibrate: [90, 40, 90],
  data: { url: '/notificacoes' }, actions: [{ action: 'open', title: 'Abrir' }],
})

/** Aviso do sistema quando a app está aberta mas em segundo plano. */
export async function showSystemNotification(title: string, body: string, force = false, tag?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted' || (!force && userOff())) return
  const reg = await navigator.serviceWorker.getRegistration()
  await reg?.showNotification(title, opts(body, force ? 'aliado-teste' : tag))
}

/** Marca de números no ícone da app instalada. */
export function setBadge(n: number) {
  const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
  try { if (n > 0) nav.setAppBadge?.(n); else nav.clearAppBadge?.() } catch { /* ignora */ }
}
