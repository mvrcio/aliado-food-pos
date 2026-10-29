import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Award, CircleHelp, Crown, Flame, Gift, MessageCircle, Search, Smartphone, UserRound } from 'lucide-react'
import { CONTACTS, fmtNum } from '../config'
import { useRules, type Rules } from '../lib/rules'

type Item = { cat: string; q: string; a: ReactNode }
const CATS: [string, typeof Flame][] = [
  ['Geral', CircleHelp], ['Aliado Prime', Flame], ['Pontos e prémios', Gift], ['Aliado Gold', Award],
  ['Aliado VIP', Crown], ['Conta e segurança', UserRound], ['A app', Smartphone],
]

function build(r: Rules): Item[] {
  const lim = fmtNum(r.vipCreditMaxKz)
  return [
    { cat: 'Geral', q: 'O que é o ALIADO+?', a: 'É o programa de fidelidade da Aliado Food, o Clube dos Sabores. Cada pedido dá-lhe vantagens (pontos, cashback ou desconto, conforme o seu cartão) e pode subir de nível: Prime, Gold e VIP.' },
    { cat: 'Geral', q: 'Como crio a minha conta?', a: 'Clique em "Criar Conta" e preencha nome, telefone/WhatsApp, email e palavra-passe (a data de nascimento é opcional). Ao criar a conta recebe automaticamente o seu cartão Aliado Prime digital.' },
    { cat: 'Geral', q: 'Como uso o cartão quando faço um pedido?', a: 'Diga o número do cartão ou mostre o QR Code à nossa equipa. O funcionário pesquisa o cartão (ou lê o QR) e regista o valor do pedido; os seus benefícios são calculados automaticamente.' },
    { cat: 'Geral', q: 'Quais são os níveis de cartão?', a: 'Aliado Prime (vermelho queimado), Aliado Gold (dourado) e Aliado VIP (preto). Cada nível tem o seu menu de botões e benefícios.' },
    { cat: 'Aliado Prime', q: 'O que ganho com o cartão Prime?', a: `O cartão Prime é gratuito. Acumula ${r.pointsPerPurchase} pontos por cada pedido, tem acesso às promoções gerais da Aliado Food e pode trocar pontos por prémios.` },
    { cat: 'Aliado Prime', q: 'Como subo de Prime para Gold?', a: `Quando acumular ${fmtNum(r.upgradePoints)} pontos ganhos em pedidos, aparece o botão "Pedir upgrade para Gold". Depois da aprovação do administrador, o seu cartão passa a Gold e esses pontos são deduzidos da sua conta. Pontos recebidos de outros clientes não contam para o upgrade.` },
    { cat: 'Aliado Prime', q: 'O Prime pode enviar pontos?', a: 'Não. O Prime só recebe pontos de clientes Gold, mas pode usá-los para trocar por prémios.' },
    { cat: 'Pontos e prémios', q: 'Como ganho pontos?', a: `Nos cartões Prime e Gold, cada pedido dá ${r.pointsPerPurchase} pontos. O Aliado VIP não ganha pontos: em vez disso, acumula Status.` },
    { cat: 'Pontos e prémios', q: 'Quantos pontos valem uma refeição grátis?', a: '3.000 pontos equivalem a uma refeição grátis. Em "Trocar Pontos" escolhe o prémio e a equipa aprova o pedido; se for recusado, os pontos são devolvidos.' },
    { cat: 'Pontos e prémios', q: 'Posso enviar pontos a outro cliente?', a: 'Só o cartão Gold envia pontos, a outros clientes Gold ou Prime, indicando o número do cartão de destino. Antes de confirmar vê o primeiro nome do destinatário. O Prime só recebe e o VIP não usa pontos.' },
    { cat: 'Pontos e prémios', q: 'Os pontos recebidos contam para o upgrade?', a: 'Não. Para o upgrade só contam os pontos ganhos em pedidos. Ao gastar pontos, usam-se primeiro os recebidos de outros clientes.' },
    { cat: 'Aliado Gold', q: 'Como funciona o cashback do Gold?', a: `Recebe ${r.cashbackPct}% de cashback em cada pedido, creditado no seu saldo em Kwanzas. O cashback é calculado sobre o valor que efectivamente paga.` },
    { cat: 'Aliado Gold', q: 'Como uso o meu saldo?', a: 'O saldo acumulado pode ser usado como desconto em futuros pedidos: peça à equipa para "usar saldo" ao registar a compra. Também tem acesso a ofertas e campanhas exclusivas para clientes Gold.' },
    { cat: 'Aliado Gold', q: 'Como recarrego o saldo?', a: `Na área do Gold, indique o valor (mínimo ${fmtNum(r.minTopup)} Kz) e peça a recarga. É aprovada por um funcionário ou pelo administrador, que são sempre avisados do pedido.` },
    { cat: 'Aliado Gold', q: 'Posso enviar dinheiro a outro cliente?', a: 'Sim, entre clientes Aliado Gold. Use "Enviar Dinheiro", indique o número do cartão do destinatário e o valor; o montante sai do seu saldo e entra no dele. Só é possível se tiver saldo suficiente.' },
    { cat: 'Aliado Gold', q: 'Como chego a VIP?', a: 'O upgrade para Aliado VIP é feito mediante convite oficial da Aliado Food.' },
    { cat: 'Aliado Gold', q: 'O meu saldo ficou negativo. O que fazer?', a: 'Acontece quando um cartão VIP é rebaixado a Gold com crédito por pagar: o valor em dívida passa a saldo negativo. Recarregue o saldo (ou receba cashback) para regularizar.' },
    { cat: 'Aliado VIP', q: 'Que benefícios tem o Aliado VIP?', a: `Programa para clientes de Alto Valor: desconto fixo de ${r.vipDiscountPct}% em todos os pedidos, prioridade máxima no atendimento e nas entregas, ofertas-surpresa e vantagens personalizadas, benefício especial no mês de aniversário e atendimento preferencial.` },
    { cat: 'Aliado VIP', q: 'O que é o Status VIP?', a: `É uma percentagem que sobe à medida que usa o ALIADO+: cada pedido acrescenta ${r.vipStatusPerPurchase}% (até 100%). O VIP não ganha pontos nem envia ou troca pontos.` },
    { cat: 'Aliado VIP', q: 'Como obtenho crédito?', a: `O botão "Obter Crédito" é liberado a partir de ${r.vipCreditMinStatus}% de Status. O limite cresce com o Status (com 100% chega a ${lim} Kz). O pedido é aprovado por um funcionário ou pelo administrador e o valor é creditado no seu saldo.` },
    { cat: 'Aliado VIP', q: 'Como amortizo o crédito?', a: 'Use o botão "Amortizar Crédito" e indique o valor pago. A amortização é aprovada pelo administrador e reduz o crédito em aberto.' },
    { cat: 'Aliado VIP', q: 'Até quando devo pagar o crédito?', a: 'O crédito deve ser amortizado até ao último dia de cada mês. A partir do dia 22 recebe lembretes diários sobre o pagamento.' },
    { cat: 'Aliado VIP', q: 'O que acontece se eu não pagar?', a: 'Se houver crédito em aberto no fim do mês, o cartão é suspenso automaticamente (pode continuar a amortizar). Se até ao dia 5 do mês seguinte o valor não for pago, o cartão passa a Gold e o valor em dívida fica como saldo negativo.' },
    { cat: 'Aliado VIP', q: 'Porque não vejo "Enviar" nem "Trocar pontos"?', a: 'O Aliado VIP não usa pontos. O seu histórico mostra compras, Status e movimentos de crédito.' },
    { cat: 'Conta e segurança', q: 'Como recebo avisos?', a: 'Pelas notificações da app (ícone do sino) e, se activar, por notificações push. Toca um pequeno som de gota de água quando chega um aviso (pode desligar no ícone de som).' },
    { cat: 'Conta e segurança', q: 'O meu cartão está bloqueado ou suspenso.', a: 'Contacte a Aliado Food. Um cartão VIP suspenso por crédito é reactivado automaticamente quando a dívida fica totalmente amortizada.' },
    { cat: 'Conta e segurança', q: 'Uma compra pode ficar registada duas vezes?', a: 'Não. Cada registo tem uma chave única, os botões ficam bloqueados enquanto processam e o sistema recusa a mesma compra repetida no mesmo cartão em poucos segundos.' },
    { cat: 'Conta e segurança', q: 'Como altero a minha data de nascimento?', a: 'Pode editar nome e telefone no seu perfil. A data de nascimento só pode ser alterada pelo administrador: contacte a Aliado Food.' },
    { cat: 'A app', q: 'Como instalo a app?', a: 'No Android, computador, Edge ou Chrome, use o botão "Instalar app" (ícone de transferência no cabeçalho ou no rodapé). No iPhone/iPad, abra no Safari, toque em Partilhar e escolha "Adicionar ao ecrã principal".' },
    { cat: 'A app', q: 'Posso usar o modo escuro?', a: 'Sim. Use o ícone de lua/sol no cabeçalho; a escolha fica guardada. As cores dos botões acompanham o seu cartão.' },
  ]
}

export default function Faq() {
  const rules = useRules()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const items = useMemo(() => build(rules), [rules])
  const shown = items.filter(i => (cat === 'Todas' || i.cat === cat) &&
    (!q.trim() || (i.q + ' ' + (typeof i.a === 'string' ? i.a : '')).toLowerCase().includes(q.trim().toLowerCase())))

  return (
    <>
      <h1 className="row"><CircleHelp size={28} color="var(--accent-text)" /> Perguntas Frequentes</h1>
      <p className="sub" style={{ color: 'var(--mut)' }}>Tudo o que precisa de saber sobre o ALIADO+.</p>
      <div className="search"><Search size={18} /><input type="search" placeholder="Pesquisar…" value={q} onChange={e => setQ(e.target.value)} aria-label="Pesquisar nas perguntas" /></div>
      <div className="tabs" role="tablist">
        {['Todas', ...CATS.map(c => c[0])].map(c => <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {shown.length === 0 && <p className="panel center">Não encontrámos resultados.</p>}
      {shown.map(i => {
        const Icon = CATS.find(c => c[0] === i.cat)![1]
        return (
          <details className="panel faq" key={i.q}>
            <summary><Icon size={18} /><span>{i.q}</span></summary>
            <p>{i.a}</p>
          </details>
        )
      })}
      <div className="panel row between">
        <span>Não encontrou a resposta?</span>
        <a className="btn" href={`https://wa.me/${CONTACTS.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Falar connosco</a>
      </div>
      <p className="center"><Link to="/">Voltar ao início</Link></p>
    </>
  )
}
