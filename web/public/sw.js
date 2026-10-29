// Service worker do ALIADO+: instalação (PWA), uso sem ligação e notificações.
// Páginas: rede primeiro (nunca mostra versões antigas se houver internet). Ficheiros /assets: em cache (têm hash).
const CACHE = 'aliado-v3'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
  await self.clients.claim()
})()))

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return                     // Supabase, fontes, etc.: nunca em cache
  if (req.headers.has('range') || req.destination === 'video' || url.pathname === '/sw.js') return

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('/index.html', copy)); return res
    }).catch(async () => (await caches.match('/index.html')) ||
      new Response('Sem ligação à internet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })))
    return
  }
  if (url.pathname.startsWith('/assets/')) {                           // ficheiros com hash: cache primeiro
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req)
      if (hit) return hit
      const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res
    }))
    return
  }
  if (/\.(png|jpe?g|webp|svg|webmanifest|woff2)$/.test(url.pathname)) { // restantes imagens: rede primeiro
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
      return res
    }).catch(async () => (await caches.match(req)) || Response.error()))
  }
})

// Notificações push: ícone, vibração, botão "Abrir", ligação directa à área certa e número no ícone da app.
// Se a app estiver aberta e à vista, não mostra aviso do sistema (a ilha dinâmica e o som tratam disso).
self.addEventListener('push', e => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = { body: e.data ? e.data.text() : '' } }
  e.waitUntil((async () => {
    if (typeof d.unread === 'number' && 'setAppBadge' in self.navigator) { try { await self.navigator.setAppBadge(d.unread) } catch (_) {} }
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (wins.some(c => c.focused && c.visibilityState === 'visible')) return
    if (d.id && (await self.registration.getNotifications({ tag: d.id })).length) return   // já mostrada
    await self.registration.showNotification(d.title || 'ALIADO+', {
      body: d.body || '', icon: '/icon-192.png', badge: '/badge-96.png', tag: d.id || undefined,
      vibrate: [90, 40, 90], timestamp: Date.now(), data: { url: d.url || '/notificacoes' },
      actions: [{ action: 'open', title: 'Abrir' }],
    })
  })())
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/notificacoes'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus() }
    return self.clients.openWindow(url)
  }))
})
