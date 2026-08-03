<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, isAdmin, signOut } = useAuth()
const supabase = useSupabase()

type RequestRow = {
  id: string
  route_title: string
  package: string
  client_name: string
  client_email: string
  client_phone: string
  start_date: string | null
  days: number
  people: number
  total_amount: number
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nova',
  contacted: 'Em contato',
  confirmed: 'Confirmada',
  declined: 'Recusada',
  archived: 'Arquivada'
}

const hostName = ref('')
const published = ref(false)
const requests = ref<RequestRow[]>([])
const routeCount = ref(0)
const loading = ref(true)
const errorMessage = ref('')
const menuOpen = ref(false)

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))

const shortDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${iso}T12:00:00Z`)) : 'a combinar'

const newCount = computed(() => requests.value.filter((request) => request.status === 'new').length)
const openTotal = computed(() =>
  requests.value
    .filter((request) => request.status !== 'declined' && request.status !== 'archived')
    .reduce((total, request) => total + Number(request.total_amount), 0)
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
})

const load = async () => {
  if (!user.value) return

  const [profileResult, requestsResult, routesResult] = await Promise.all([
    supabase.from('guides').select('name, published').eq('id', user.value.id).maybeSingle(),
    supabase.from('requests')
      .select('id, route_title, package, client_name, client_email, client_phone, start_date, days, people, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    // Sem o filtro por dono, o RLS deixa ver roteiros ativos de anfitriões
    // publicados e a contagem soma os dos outros.
    supabase.from('routes').select('id', { count: 'exact', head: true })
      .eq('guide_id', user.value.id).eq('active', true)
  ])

  loading.value = false

  const failure = profileResult.error ?? requestsResult.error ?? routesResult.error
  if (failure) {
    errorMessage.value = failure.message
    return
  }

  hostName.value = profileResult.data?.name ?? ''
  published.value = profileResult.data?.published ?? false
  requests.value = (requestsResult.data ?? []) as RequestRow[]
  routeCount.value = routesResult.count ?? 0
}

onMounted(load)

// Recebe o evento em vez do valor: cast TypeScript não é válido dentro de
// expressão de template.
const updateStatus = async (request: RequestRow, event: Event) => {
  errorMessage.value = ''

  const status = (event.target as HTMLSelectElement).value

  const { error } = await supabase.from('requests').update({ status }).eq('id', request.id)
  if (error) {
    errorMessage.value = error.message
    return
  }

  request.status = status
}

const closeMenu = () => { menuOpen.value = false }
</script>

<template>
  <main class="admin-page">
    <aside class="admin-sidebar">
      <div class="admin-sidebar-top">
        <BrandLogo />
        <button class="admin-menu-trigger" type="button" aria-controls="admin-menu" :aria-expanded="menuOpen" aria-label="Abrir menu do painel" @click="menuOpen = !menuOpen"><span /><span /><span /></button>
      </div>
      <nav id="admin-menu" :class="{ 'is-open': menuOpen }" aria-label="Navegação do painel">
        <NuxtLink class="active" to="/painel" @click="closeMenu">Visão geral</NuxtLink>
        <NuxtLink to="/painel/roteiros" @click="closeMenu">Meus roteiros</NuxtLink>
        <NuxtLink to="/painel/perfil" @click="closeMenu">Meus dados</NuxtLink>
        <NuxtLink v-if="isAdmin" to="/painel/admin" @click="closeMenu">Administração</NuxtLink>
        <NuxtLink to="/" @click="closeMenu">Ver site público</NuxtLink>
        <button type="button" @click="signOut">Sair</button>
      </nav>
      <p>Painel do anfitrião</p>
    </aside>

    <section class="admin-content">
      <header class="admin-title-row">
        <div>
          <p class="eyebrow">Painel do anfitrião</p>
          <h1>{{ greeting }}{{ hostName ? `, ${hostName.split(' ')[0]}` : '' }}.</h1>
          <p v-if="published">Seu perfil está no ar. As solicitações abaixo chegaram pelo site.</p>
          <p v-else>Seu perfil ainda não está publicado, então o site ainda não envia solicitações para você.</p>
        </div>
        <ThemeToggle />
      </header>

      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
      <p v-if="loading" class="admin-loading">Carregando…</p>

      <template v-else>
        <div class="metric-grid">
          <article><span>Solicitações novas</span><strong>{{ newCount }}</strong><small>de {{ requests.length }} recebidas</small></article>
          <article><span>Roteiros ativos</span><strong>{{ routeCount }}</strong><small><NuxtLink to="/painel/roteiros">gerenciar</NuxtLink></small></article>
          <article><span>Em aberto</span><strong>{{ money(openTotal) }}</strong><small>soma das não recusadas</small></article>
        </div>

        <section id="solicitacoes" class="request-section">
          <div class="section-heading">
            <div><p class="eyebrow">Acompanhar contatos</p><h2>Solicitações</h2></div>
          </div>

          <p v-if="!requests.length" class="admin-loading">
            Nenhuma solicitação ainda.
            <template v-if="!routeCount">Comece cadastrando um roteiro em <NuxtLink to="/painel/roteiros">Meus roteiros</NuxtLink>.</template>
          </p>

          <div v-else class="requests-table" role="table" aria-label="Solicitações recebidas">
            <div class="table-head table-head-requests" role="row"><span>Cliente</span><span>Roteiro</span><span>Início</span><span>Valor</span><span>Situação</span></div>
            <div v-for="request in requests" :key="request.id" class="table-row table-row-requests" role="row">
              <span><b>{{ request.client_name }}</b><small>{{ request.client_email }} · {{ request.client_phone }}</small></span>
              <span>{{ request.route_title }}<small>{{ request.package }} · {{ request.days }} dia(s) · {{ request.people }} pessoa(s)</small></span>
              <span>{{ shortDate(request.start_date) }}</span>
              <b>{{ money(request.total_amount) }}</b>
              <span>
                <select class="status-select" :value="request.status" @change="updateStatus(request, $event)">
                  <option v-for="(label, value) in STATUS_LABELS" :key="value" :value="value">{{ label }}</option>
                </select>
              </span>
            </div>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.admin-loading { color: var(--muted); font-size: 14px; }

.admin-error {
  margin: 0 0 18px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #ed725420;
  color: var(--coral);
  font-size: 13px;
}

.status-select {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel-solid);
  color: inherit;
  font: inherit;
  font-size: 12px;
}

.table-head-requests,
.table-row-requests { grid-template-columns: 1.5fr 1.5fr 0.6fr 0.7fr 1fr; }
</style>
