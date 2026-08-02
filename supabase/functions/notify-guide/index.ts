// Varre solicitações ainda não notificadas e avisa cada guia por e-mail.
// Chamada por pg_cron a cada minuto. Idempotente: só pega notified_at is null
// e carimba depois do envio confirmado, então falha de rede vira retentativa
// no próximo ciclo em vez de e-mail perdido ou duplicado.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))

const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${iso}T12:00:00Z`))
    : 'a combinar'

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromAddress = Deno.env.get('RESEND_FROM') ?? 'PersonalTravel <onboarding@resend.dev>'

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: 'missing_env' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: pending, error } = await supabase
    .from('requests')
    .select('id, guide_id, route_title, package, total_amount, client_name, client_email, client_phone, start_date, days, people, guides(name, email)')
    .is('notified_at', null)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!pending?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  let sent = 0
  const failures: Array<{ id: string, reason: string }> = []

  for (const request of pending) {
    const guide = request.guides as unknown as { name: string, email: string | null } | null
    if (!guide?.email) {
      failures.push({ id: request.id, reason: 'guia sem e-mail cadastrado' })
      continue
    }

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#16201b;">
        <p style="color:#65706b;font-size:13px;margin:0;">Nova solicitação · PersonalTravel</p>
        <h2 style="margin:4px 0 16px;">${escapeHtml(request.client_name)}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#65706b;">Roteiro</td><td style="padding:6px 0;"><strong>${escapeHtml(request.route_title)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#65706b;">Pacote</td><td style="padding:6px 0;">${escapeHtml(request.package)}</td></tr>
          <tr><td style="padding:6px 0;color:#65706b;">Início</td><td style="padding:6px 0;">${formatDate(request.start_date)}</td></tr>
          <tr><td style="padding:6px 0;color:#65706b;">Grupo</td><td style="padding:6px 0;">${request.days} dia(s) · ${request.people} pessoa(s)</td></tr>
          <tr><td style="padding:6px 0;color:#65706b;">Valor estimado</td><td style="padding:6px 0;"><strong>${money(request.total_amount)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#65706b;">Contato</td><td style="padding:6px 0;">${escapeHtml(request.client_email)}<br>${escapeHtml(request.client_phone)}</td></tr>
        </table>
        <p style="color:#65706b;font-size:12px;margin-top:20px;">
          Isto é um pedido de proposta, não uma reserva confirmada. Responda este e-mail para falar direto com a pessoa.
        </p>
      </div>`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress,
        to: [guide.email],
        reply_to: request.client_email,
        subject: `Nova solicitação — ${request.route_title}`,
        html,
      }),
    })

    if (!response.ok) {
      failures.push({ id: request.id, reason: `resend ${response.status}` })
      continue
    }

    // Carimba só depois do envio aceito: se o update falhar, o pior caso é
    // um e-mail repetido no próximo ciclo, nunca um pedido silenciado.
    const { error: stampError } = await supabase
      .from('requests')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', request.id)

    if (stampError) failures.push({ id: request.id, reason: `stamp: ${stampError.message}` })
    sent += 1
  }

  return new Response(JSON.stringify({ sent, failures }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
