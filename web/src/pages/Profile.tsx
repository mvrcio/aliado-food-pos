import { useEffect, useState, type FormEvent } from 'react'
import { BellOff, BellRing, KeyRound, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { fmtDate } from '../config'
import { checkPassword } from '../lib/password'
import { deviceSubscribed, disableNotifications, enableNotifications, notificationState, pushServerConfigured, showSystemNotification, type PushState } from '../lib/push'
import { islandNotify } from '../lib/island'
import { playSound } from '../lib/sound'
import type { Profile as P } from '../lib/types'
import Msg, { type Flash } from '../components/Msg'

export default function Profile() {
  const { session } = useAuth()
  const [p, setP] = useState<P | null>(null)
  const [msg, setMsg] = useState<Flash>(null)
  const [busy, setBusy] = useState(false)
  const [push, setPush] = useState<PushState>(notificationState())
  const [subscribed, setSubscribed] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState<Flash>(null)

  useEffect(() => { supabase.from('profiles').select('*').maybeSingle().then(r => setP(r.data as P)) }, [])
  useEffect(() => { deviceSubscribed().then(setSubscribed) }, [push])
  if (!p) return null

  async function save() {
    if (busy) return
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ full_name: p!.full_name.trim(), phone: p!.phone?.trim() ?? null }).eq('id', p!.id)
    setBusy(false)
    setMsg(error ? { ok: false, text: 'Não foi possível guardar.' } : { ok: true, text: 'Alterações guardadas.' })
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault()
    const bad = checkPassword(pw) ?? (pw !== pw2 ? 'As palavras-passe não coincidem.' : null)
    if (bad) return setPwMsg({ ok: false, text: bad })
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return setPwMsg({ ok: false, text: 'Não foi possível alterar. Saia e entre de novo, depois tente outra vez.' })
    setPw(''); setPw2(''); setPwMsg({ ok: true, text: 'Palavra-passe alterada.' })
  }
  async function test() {
    playSound(true)
    islandNotify('ALIADO+', 'Teste: as notificações estão a funcionar.')
    await showSystemNotification('ALIADO+', 'Teste: as notificações estão a funcionar.', true)
  }

  return (
    <>
      <div className="panel narrow">
        <h1 className="row"><UserRound size={26} color="var(--accent-text)" /> Meu Perfil</h1>
        <label htmlFor="n">Nome Completo</label><input id="n" autoComplete="name" value={p.full_name} onChange={e => setP({ ...p, full_name: e.target.value })} />
        <label htmlFor="t">Telefone / WhatsApp</label><input id="t" autoComplete="tel" value={p.phone ?? ''} onChange={e => setP({ ...p, phone: e.target.value })} />
        <label>Email</label><input disabled value={session?.user.email ?? ''} />
        <label>Data de Nascimento</label><input disabled value={p.birth_date ?? ''} placeholder="dd/mm/aaaa" />
        <small>Contacte o administrador para alterar.</small>
        <label>Data de Adesão</label><input disabled value={fmtDate(p.created_at)} />
        <p><Msg m={msg} /></p>
        <button className="btn" style={{ width: '100%' }} onClick={save} disabled={busy}><Save size={18} /> Guardar Alterações</button>
      </div>

      <div className="panel narrow">
        <h3 className="row"><BellRing size={20} color="var(--accent-text)" /> Notificações neste aparelho</h3>
        <p>
          {push === 'unsupported' && 'Este browser não suporta notificações.'}
          {push === 'denied' && 'Bloqueadas no browser. Permita-as nas definições do site para as receber.'}
          {push === 'off' && 'Desactivadas.'}
          {push === 'on' && (pushServerConfigured() ? (subscribed ? 'Activas, mesmo com a app fechada.' : 'Activas com a app aberta. Toque em Activar para receber também com a app fechada.') : 'Activas com a app aberta.')}
        </p>
        <div className="row">
          {(push === 'off' || (push === 'on' && pushServerConfigured() && !subscribed)) && (
            <button className="btn" onClick={async () => { setPush(await enableNotifications()); setSubscribed(await deviceSubscribed()) }}><BellRing size={18} /> Activar</button>
          )}
          {push === 'on' && <button className="btn btn-ghost" onClick={async () => setPush(await disableNotifications())}><BellOff size={18} /> Desactivar</button>}
          <button className="btn btn-ghost" onClick={test}>Testar</button>
        </div>
      </div>

      <form className="panel narrow" onSubmit={changePassword}>
        <h3 className="row"><ShieldCheck size={20} color="var(--accent-text)" /> Segurança</h3>
        <label htmlFor="np">Nova palavra-passe</label>
        <input id="np" type="password" minLength={8} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} />
        <label htmlFor="np2">Repita a palavra-passe</label>
        <input id="np2" type="password" minLength={8} autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} />
        <p><Msg m={pwMsg} /></p>
        <div className="row">
          <button className="btn" disabled={!pw}><KeyRound size={18} /> Alterar palavra-passe</button>
          <button type="button" className="btn btn-ghost" title="Termina a sessão em todos os aparelhos"
            onClick={async () => { await supabase.auth.signOut({ scope: 'global' }) }}><LogOut size={18} /> Sair de todos os aparelhos</button>
        </div>
      </form>
    </>
  )
}
