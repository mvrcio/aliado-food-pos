import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Card } from './types'
import { playSound } from './sound'
import { deviceSubscribed, registerSW, setBadge, showSystemNotification } from './push'
import { islandNotify } from './island'

interface Ctx {
  session: Session | null; loading: boolean; isAdmin: boolean; isStaff: boolean
  card: Card | null; unread: number; homePath: string; refresh: () => Promise<void>
}
const AuthCtx = createContext<Ctx>({} as Ctx)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<string[]>([])
  const [card, setCard] = useState<Card | null>(null)
  const [unread, setUnread] = useState(0)
  const lastId = useRef<string | null | undefined>(undefined)

  async function load(s: Session | null) {
    if (!s) { setRoles([]); setCard(null); setUnread(0); return }
    const [r, c, n] = await Promise.all([
      supabase.from('user_roles').select('role'),
      supabase.from('cards').select('*').eq('holder_id', s.user.id).maybeSingle(),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false),
    ])
    let mine = c.data as Card | null
    if (!mine) {   // cartão apagado ou conta antiga: garante um cartão Prime
      const { data } = await supabase.rpc('ensure_my_card')
      mine = (data as Card | null) ?? null
    }
    setRoles((r.data ?? []).map(x => x.role)); setCard(mine); setUnread(n.count ?? 0)
  }
  const refresh = async () => load((await supabase.auth.getSession()).data.session)
  const loadRef = useRef(load); loadRef.current = load

  // Sessão: só mostra "a carregar" quando o utilizador muda (não em cada renovação de token)
  useEffect(() => {
    registerSW()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const id = s?.user.id ?? null
      setSession(s)
      if (lastId.current === id) return
      lastId.current = id
      setLoading(true)
      setTimeout(() => { loadRef.current(s).catch(() => {}).finally(() => setLoading(false)) }, 0)  // fora do callback: evita bloqueios
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // O tema de cor acompanha o nível do cartão da conta
  useEffect(() => {
    document.documentElement.dataset.tier = card?.tier ?? 'prime'
  }, [card?.tier])

  // Notificações em tempo real + sino
  useEffect(() => {
    if (!session) return
    const uid = session.user.id
    const ch = supabase.channel(`notifs-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        payload => {
          const n = payload.new as { id?: string; title?: string; message?: string }
          playSound()
          islandNotify(n.title ?? 'ALIADO+', n.message ?? '', (payload.new as { type?: string }).type)
          if (document.hidden) {   // com push activo é o servidor que avisa; senão avisa a própria página (sem duplicar)
            deviceSubscribed().then(sub => { if (!sub) showSystemNotification(n.title ?? 'ALIADO+', n.message ?? '', false, n.id) })
          }
          loadRef.current(session).catch(() => {})
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session?.user.id])

  const isAdmin = roles.includes('admin')
  const isStaff = isAdmin || roles.includes('employee')

  // Número de avisos no ícone da app instalada
  useEffect(() => { setBadge(session ? unread : 0) }, [unread, session])

  // Contas da equipa: termina a sessão após 30 minutos sem actividade
  useEffect(() => {
    if (!session || !isStaff) return
    let t = 0
    const reset = () => { window.clearTimeout(t); t = window.setTimeout(() => { supabase.auth.signOut() }, 30 * 60 * 1000) }
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    evs.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => { window.clearTimeout(t); evs.forEach(e => window.removeEventListener(e, reset)) }
  }, [session?.user.id, isStaff])
  const homePath = isAdmin ? '/admin' : isStaff ? '/funcionario' : '/cartao'
  return (
    <AuthCtx.Provider value={{ session, loading, isAdmin, isStaff, card, unread, homePath, refresh }}>
      {children}
    </AuthCtx.Provider>
  )
}
