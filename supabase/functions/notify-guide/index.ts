// Notifica anfitrião e cliente sobre solicitações novas.
//
// Chamada por pg_cron a cada minuto. Idempotente: cada envio tem seu próprio
// carimbo e só é feito quando o carimbo está nulo, então falha de rede vira
// retentativa no ciclo seguinte em vez de e-mail perdido ou duplicado.
//
// Envia pela API HTTP do Brevo, não por SMTP. A tentativa com denomailer
// falhava em "invalid cmd at SMTPConnection.assertCode": o runtime das Edge
// Functions não completa o diálogo STARTTLS em TCP cru. A API é fetch comum,
// que o runtime faz bem.
//
// Migrar para outro provedor (Resend, Mailjet) é trocar a URL, o cabeçalho de
// autenticação e o formato do corpo em sendEmail(). O resto não muda.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

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

const safeName = (value: string) =>
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
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  const mailFrom = Deno.env.get('MAIL_FROM')
  const brand = Deno.env.get('MAIL_FROM_NAME') ?? 'PersonalTravel'

  if (!supabaseUrl || !serviceRoleKey || !brevoKey || !mailFrom) {
    return new Response(JSON.stringify({ error: 'missing_env' }), { status: 500 })
  }

  // Lança em falha para o chamador registrar em `failures` e tentar de novo no
  // próximo ciclo — o carimbo só é gravado depois que isto retorna sem erro.
  const sendEmail = async (payload: {
    toEmail: string
    toName?: string
    fromName: string
    replyTo: string
    subject: string
    html: string
  }) => {
    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        sender: { name: safeName(payload.fromName), email: mailFrom },
        to: [{ email: payload.toEmail, name: payload.toName ? safeName(payload.toName) : undefined }],
        replyTo: { email: payload.replyTo },
        subject: payload.subject,
        htmlContent: payload.html
      })
    })

    if (!response.ok) {
      throw new Error(`brevo ${response.status}: ${(await response.text()).slice(0, 300)}`)
    }
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

  let hostSent = 0
  let clientSent = 0
  const failures: Array<{ id: string, target: string, reason: string }> = []

  for (const request of pending) {
    const host = request.guides as unknown as { name: string, email: string | null } | null

    // --- anfitrião ---
    if (!request.notified_at) {
      if (!host?.email) {
        failures.push({ id: request.id, target: 'host', reason: 'anfitrião sem e-mail cadastrado' })
      } else {
        try {
          await sendEmail({
            toEmail: host.email,
            toName: host.name,
            // O nome exibido carrega quem pediu; o endereço permanece o nosso,
            // porque só podemos enviar do remetente verificado no Brevo.
            fromName: `${request.client_name} (via ${brand})`,
            replyTo: request.client_email,
            subject: `Nova solicitação — ${request.route_title}`,
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
        await sendEmail({
          toEmail: request.client_email,
          toName: request.client_name,
          fromName: brand,
          // Responder chega no anfitrião, para a conversa seguir sem o painel.
          replyTo: host?.email ?? mailFrom,
          subject: `Recebemos seu pedido — ${request.route_title}`,
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

  return new Response(JSON.stringify({ host: hostSent, client: clientSent, failures }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
