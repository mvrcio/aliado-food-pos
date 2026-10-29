# Aliado Food POS
Cores oficiais: vermelho #BF230E · laranja #F0991C · slogan #C1272D.
Aliado Sabores - Comércio e Serviços (SU), Lda. · NIF 5002726300 · 929 809 889 · aliadofood@hotmail.com

## Publicar
1. **GitHub**: crie o repositório `aliado-food-pos` e envie estes ficheiros.
2. **Supabase**: crie o projecto, execute `schema.sql`, crie os utilizadores em Authentication e insira cada um em `profiles` com o seu perfil.
3. **Vercel**: Import do repositório (projecto estático, sem build). Fica HTTPS, necessário para instalar a app e receber push.
4. **Instalar**: abrir o link no telemóvel/PC e escolher "Instalar app" / "Adicionar ao ecrã inicial".

## Próximos passos
- Ligar `index.html` ao Supabase (login real, dados partilhados e em tempo real).
- Push: gerar chaves VAPID, guardar a subscrição em `push_subscriptions` e enviar via Edge Function quando um pedido muda de estado. O `sw.js` já trata `push` e `notificationclick`.
- iOS só recebe push com a app instalada no ecrã inicial (iOS 16.4+).
