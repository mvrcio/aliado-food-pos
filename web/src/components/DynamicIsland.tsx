import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Download, Share } from 'lucide-react'
import { getIsland, islandClose, islandDismiss, islandDismissed, islandInstall, islandOpen, useIsland, type IslandItem } from '../lib/island'
import { useInstall } from '../lib/install'

// Ilha dinâmica: uma cápsula preta no topo que "salta" para fora, expande e volta a recolher.
export default function DynamicIsland() {
  const { item, open } = useIsland()
  const inst = useInstall()
  const nav = useNavigate()
  const last = useRef<IslandItem | null>(null)
  const [vis, setVis] = useState(false)
  if (item) last.current = item
  const shown = item ?? last.current

  // Entra com animação
  useEffect(() => {
    if (!item) { setVis(false); return }
    const r = requestAnimationFrame(() => setVis(true))
    return () => cancelAnimationFrame(r)
  }, [item?.id])

  // Oferece a instalação (uma vez por sessão, a não ser que o utilizador diga "agora não")
  useEffect(() => {
    if (inst.installed || !(inst.canPrompt || inst.ios) || islandDismissed()) return
    const t = window.setTimeout(() => { if (!getIsland().item) islandInstall(true) }, 3500)
    return () => window.clearTimeout(t)
  }, [inst.installed, inst.canPrompt, inst.ios])

  // Recolhe e desaparece sozinha
  useEffect(() => {
    if (!item) return
    if (open) { try { navigator.vibrate?.(12) } catch { /* ignora */ } }
    const t = window.setTimeout(() => (open ? islandOpen(false) : islandClose()), open ? (item.kind === 'notif' ? 6000 : 10000) : (item.kind === 'notif' ? 2500 : 12000))
    return () => window.clearTimeout(t)
  }, [item?.id, open, item?.kind])

  if (!shown) return null
  const isInstall = shown.kind === 'install'
  const cls = `island ${vis && item ? 'show' : ''} ${vis && item && open ? 'open' : ''}`

  async function install() {
    if (inst.canPrompt) { await inst.prompt(); islandClose() } else islandClose()
  }

  return (
    <div className={cls} role="status" aria-live="polite">
      <button className="island-head" onClick={() => item && islandOpen(!open)} aria-expanded={open}
        aria-label={isInstall ? 'Instalar a app' : `Notificação: ${shown.title}`}>
        {isInstall ? <Download size={18} aria-hidden /> : <Bell size={18} aria-hidden />}
        <span className="island-title">{isInstall ? 'Instalar app' : shown.title}</span>
        <span className="island-dots" aria-hidden><i /><i /><i /></span>
      </button>
      <div className="island-body"><div className="island-inner">
        <div className="island-row">
          <img src="/icon-mark.png" alt="" width={36} height={35} />
          <div>
            <strong>{isInstall ? 'Instalar ALIADO+' : shown.title}</strong>
            <p>{isInstall
              ? (inst.canPrompt ? 'Tenha o ALIADO+ no ecrã principal: abre mais depressa e recebe avisos.' : 'No iPhone ou iPad, instale em 3 toques:')
              : shown.text}</p>
          </div>
        </div>
        {isInstall && !inst.canPrompt && (
          <ol className="island-steps">
            <li>Abra no <strong>Safari</strong></li>
            <li>Toque em <strong>Partilhar</strong> <Share size={14} style={{ verticalAlign: '-2px' }} /></li>
            <li>Escolha <strong>Adicionar ao ecrã principal</strong></li>
          </ol>
        )}
        <div className="island-actions">
          {isInstall ? (
            <>
              <button className="island-btn" onClick={() => { islandDismiss(); islandClose() }}>{inst.canPrompt ? 'Agora não' : 'Percebi'}</button>
              {inst.canPrompt && <button className="island-btn primary" onClick={install}><Download size={16} /> Instalar</button>}
            </>
          ) : (
            <>
              <button className="island-btn" onClick={islandClose}>Fechar</button>
              <button className="island-btn primary" onClick={() => { islandClose(); nav('/notificacoes') }}>Abrir</button>
            </>
          )}
        </div>
      </div></div>
    </div>
  )
}
