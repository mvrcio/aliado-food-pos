import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, CircleHelp, CreditCard, Crown, Flame, ShieldCheck, Star, TrendingUp } from 'lucide-react'

const CARDS = [
  { tier: 'prime', icon: Flame, name: 'ALIADO PRIME', text: 'Cartão base gratuito. 300 pontos por pedido; 3.000 pontos valem uma refeição grátis.' },
  { tier: 'gold', icon: Award, name: 'ALIADO GOLD', text: '5% de cashback em cada pedido, usado como desconto, saldo recarregável, envio de dinheiro e pontos entre clientes e campanhas exclusivas.' },
  { tier: 'vip', icon: Crown, name: 'ALIADO VIP', text: 'Desconto fixo em todos os pedidos, Status que desbloqueia crédito, prioridade máxima no atendimento e nas entregas.' },
] as const
const STEPS = [
  [CreditCard, 'Receba seu Cartão', 'Ganhe o cartão Prime na primeira compra'],
  [Star, 'Acumule Pontos', 'Cada pedido gera pontos e benefícios'],
  [TrendingUp, 'Suba de Nível', 'Evolua para Gold ou VIP com mais vantagens'],
  [ShieldCheck, 'Seguro e Rápido', 'Sistema seguro com notificações automáticas'],
] as const

// Vídeo no topo da página, com o título e os botões por cima
function VideoHero() {
  const ref = useRef<HTMLVideoElement>(null)
  const [reduce] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  // Só toca quando está visível (poupa bateria e dados)
  useEffect(() => {
    const v = ref.current
    if (!v || reduce || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause() }, { threshold: 0.25 })
    io.observe(v)
    return () => io.disconnect()
  }, [reduce])
  return (
    <section className="video-hero" aria-label="ALIADO+ Clube dos Sabores">
      <video ref={ref} muted loop playsInline preload="metadata" poster="/hero-poster.jpg" controls={reduce} aria-hidden={!reduce}>
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay">
        <h1>ALIADO<b>+</b></h1>
        <p className="sub"><strong>Clube dos Sabores</strong></p>
        <p>O seu programa de fidelidade. Acumule pontos, ganhe cashback e desfrute de benefícios exclusivos.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link className="btn" to="/entrar?novo=1">Criar Conta</Link>
          <Link className="btn btn-light" to="/entrar">Entrar</Link>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <VideoHero />
      <h2 style={{ textAlign: 'center' }}>Nossos Cartões</h2>
      <p className="sub" style={{ textAlign: 'center', color: 'var(--mut)' }}>Escolha o nível perfeito para si</p>
      <div className="grid g3">
        {CARDS.map(c => (
          <div className="panel" key={c.tier}>
            <img className="card-shot" src={`/cards/${c.tier}.webp`} width={840} height={480} loading="lazy"
              alt={`Cartão ${c.name.charAt(0) + c.name.slice(1).toLowerCase()}`} />
            <h3 className="row"><c.icon size={20} /> {c.name}</h3><p>{c.text}</p>
          </div>
        ))}
      </div>
      <h2 style={{ textAlign: 'center', marginTop: 40 }}>Como Funciona</h2>
      <div className="grid g3">
        {STEPS.map(([Icon, t, d]) => (
          <div className="panel" key={t}><div className="ico" style={{ marginBottom: 10 }}><Icon size={22} /></div><h3>{t}</h3><p>{d}</p></div>
        ))}
      </div>
      <p className="center"><Link className="btn btn-ghost" to="/perguntas-frequentes"><CircleHelp size={18} /> Perguntas Frequentes</Link></p>
    </>
  )
}
