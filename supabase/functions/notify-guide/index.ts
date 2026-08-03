// Notifica anfitrião e cliente sobre solicitações novas.
//
// Chamada por pg_cron a cada minuto. Idempotente: cada envio tem seu próprio
// carimbo e só é feito quando o carimbo está nulo, então falha de rede vira
// retentativa no ciclo seguinte em vez de e-mail perdido ou duplicado.
//
// Envia por SMTP genérico, configurado por variáveis de ambiente. Escolhemos
// SMTP em vez da API do Resend porque o Resend exige domínio próprio
// verificado, e ainda não temos domínio.
//
// Funciona com qualquer provedor que aceite remetente sem domínio próprio:
//   Brevo    smtp-relay.brevo.com:587   (verifica um e-mail avulso)
//   Gmail    smtp.gmail.com:465          (exige 2FA e senha de app)
//   Mailjet  in-v3.mailjet.com:587
// Trocar de provedor é trocar variáveis, não código.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))

const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${iso}T12:00:00Z`))
    : 'a combinar'

const escapeHtml = (value: string) =>
  String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

// O nome exibido não pode conter aspas ou quebras: viraria injeção de cabeçalho.
const safeDisplayName = (value: string) =>
  String(value ?? '').replace(/["\r\n<>]/g, '').trim().slice(0, 60)

const shell = (title: string, body: string) => `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#16201b;">
    <p style="color:#65706b;font-size:13px;margin:0;">${title}</p>
    ${body}
    <p style="color:#65706b;font-size:12px;margin-top:22px;border-top:1px solid #e5e2d9;padding-top:12px;">
      PersonalTravel · Este é um pedido de proposta, não uma reserva confirmada.
    </p>
  </div>`

const detailRows = (request: any) => `
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:6px 0;color:#65706b;">Roteiro</td><td style="padding:6px 0;"><strong>${escapeHtml(request.route_title)}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#65706b;">Pacote</td><td style="padding:6px 0;">${escapeHtml(request.package)}</td></tr>
    <tr><td style="padding:6px 0;color:#65706b;">Início</td><td style="padding:6px 0;">${formatDate(request.start_date)}</td></tr>
    <tr><td style="padding:6px 0;color:#65706b;">Grupo</td><td style="padding:6px 0;">${request.days} dia(s) · ${request.people} pessoa(s)</td></tr>
    <tr><td style="padding:6px 0;color:#65706b;">Valor estimado</td><td style="padding:6px 0;"><strong>${money(request.total_amount)}</strong></td></tr>
  </table>`

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const smtpHost = Deno.env.get('SMTP_HOST')
  const smtpPort = Number(Deno.env.get('SMTP_PORT') ?? '587')
  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPassword = Deno.env.get('SMTP_PASSWORD')
  // Em provedores de relay o usuário de login não é o remetente: o Brevo
  // autentica com um identificador próprio e envia pelo e-mail verificado.
  const mailFrom = Deno.env.get('MAIL_FROM') ?? smtpUser
  const brand = Deno.env.get('MAIL_FROM_NAME') ?? 'PersonalTravel'

  if (!supabaseUrl || !serviceRoleKey || !smtpHost || !smtpUser || !smtpPassword || !mailFrom) {
    return new Response(JSON.stringify({ error: 'missing_env' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: pending, error } = await supabase
    .from('requests')
    .select('id, route_title, package, total_amount, client_name, client_email, client_phone, start_date, days, people, notified_at, client_notified_at, guides(name, email)')
    .or('notified_at.is.null,client_notified_at.is.null')
    .order('created_at', { ascending: true })
    .limit(30)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!pending?.length) return new Response(JSON.stringify({ host: 0, client: 0 }), { status: 200 })

  // Uma conexão para toda a rodada: abrir uma por mensagem faz os provedores
  // estrangularem a conta por excesso de handshakes.
  // Porta 465 fala TLS desde o handshake; 587 começa em claro e sobe para TLS
  // com STARTTLS, que o denomailer negocia sozinho quando tls é falso.
  const smtp = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: smtpPort === 465,
      auth: { username: smtpUser, password: smtpPassword }
    }
  })

  let hostSent = 0
  let clientSent = 0
  const failures: Array<{ id: string, target: string, reason: string }> = []

  try {
    for (const request of pending) {
      const host = request.guides as unknown as { name: string, email: string | null } | null

      // --- anfitrião ---
      if (!request.notified_at) {
        if (!host?.email) {
          failures.push({ id: request.id, target: 'host', reason: 'anfitrião sem e-mail cadastrado' })
        } else {
          try {
            await smtp.send({
              // O nome exibido carrega quem pediu; o endereço permanece o nosso,
              // porque só podemos assinar mensagens do domínio que controlamos.
              from: `${safeDisplayName(request.client_name)} (via ${brand}) <${mailFrom}>`,
              to: host.email,
              replyTo: request.client_email,
              subject: `Nova solicitação — ${request.route_title}`,
              content: 'auto',
              html: shell('Nova solicitação', `
                <h2 style="margin:4px 0 16px;">${escapeHtml(request.client_name)}</h2>
                <p style="margin:0 0 14px;font-size:14px;">
                  ${escapeHtml(request.client_email)}<br>${escapeHtml(request.client_phone)}
                </p>
                ${detailRows(request)}
                <p style="color:#65706b;font-size:13px;margin-top:18px;">
                  Responda este e-mail para falar direto com a pessoa.
                </p>`)
            })

            const { error: stampError } = await supabase
              .from('requests')
              .update({ notified_at: new Date().toISOString() })
              .eq('id', request.id)

            if (stampError) failures.push({ id: request.id, target: 'host', reason: `stamp: ${stampError.message}` })
            hostSent += 1
          } catch (sendError) {
            failures.push({ id: request.id, target: 'host', reason: String(sendError) })
          }
        }
      }

      // --- cliente ---
      if (!request.client_notified_at) {
        try {
          await smtp.send({
            from: `${brand} <${mailFrom}>`,
            to: request.client_email,
            // Responder chega no anfitrião, para a conversa seguir sem o painel.
            replyTo: host?.email ?? mailFrom,
            subject: `Recebemos seu pedido — ${request.route_title}`,
            content: 'auto',
            html: shell('Pedido recebido', `
              <h2 style="margin:4px 0 16px;">Obrigado, ${escapeHtml(request.client_name.split(' ')[0] ?? '')}!</h2>
              <p style="margin:0 0 14px;font-size:14px;">
                ${escapeHtml(host?.name ?? 'Seu anfitrião')} recebeu seu pedido e vai responder neste e-mail
                com uma proposta ajustada ao seu grupo.
              </p>
              ${detailRows(request)}
              <p style="color:#65706b;font-size:13px;margin-top:18px;">
                O valor acima é uma estimativa a partir do roteiro escolhido. A proposta final pode variar
                conforme o que for combinado. Transporte ainda não está incluso.
              </p>`)
          })

          const { error: stampError } = await supabase
            .from('requests')
            .update({ client_notified_at: new Date().toISOString() })
            .eq('id', request.id)

          if (stampError) failures.push({ id: request.id, target: 'client', reason: `stamp: ${stampError.message}` })
          clientSent += 1
        } catch (sendError) {
          failures.push({ id: request.id, target: 'client', reason: String(sendError) })
        }
      }
    }
  } finally {
    await smtp.close()
  }

  return new Response(JSON.stringify({ host: hostSent, client: clientSent, failures }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
