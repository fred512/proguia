<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const supabase = useSupabase()
const { signOut } = useAuth()

type GuideRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  region: string | null
  published: boolean
  created_at: string
}

type RequestRow = {
  id: string
  guide_id: string
  route_title: string
  client_name: string
  client_email: string
  total_amount: number
  status: string
  created_at: string
}

type InviteRow = {
  token: string
  email: string | null
  note: string | null
  created_at: string
  expires_at: string
  used_at: string | null
}

type ApplicationRow = {
  id: string
  name: string
  email: string
  phone: string | null
  region: string | null
  message: string | null
  status: string
  created_at: string
}

const guides = ref<GuideRow[]>([])
const requests = ref<RequestRow[]>([])
const invites = ref<InviteRow[]>([])
const applications = ref<ApplicationRow[]>([])

const loading = ref(true)
const errorMessage = ref('')
const menuOpen = ref(false)

const inviteEmail = ref('')
const inviteNote = ref('')
const creatingInvite = ref(false)
const lastInviteLink = ref('')
const copied = ref(false)

// As colunas guardam o valor cru do banco; a tela mostra em português.
const APPLICATION_LABELS: Record<string, string> = {
  new: 'nova',
  contacted: 'em contato',
  invited: 'convidado',
  declined: 'recusado'
}

const REQUEST_LABELS: Record<string, string> = {
  new: 'nova',
  contacted: 'em contato',
  confirmed: 'confirmada',
  declined: 'recusada',
  archived: 'arquivada'
}

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso))

const guideName = (id: string) => guides.value.find((guide) => guide.id === id)?.name ?? '—'

const publishedCount = computed(() => guides.value.filter((guide) => guide.published).length)
const openRequests = computed(() => requests.value.filter((request) => request.status === 'new').length)
const pipeline = computed(() =>
  requests.value
    .filter((request) => request.status !== 'declined' && request.status !== 'archived')
    .reduce((total, request) => total + Number(request.total_amount), 0)
)

const load = async () => {
  errorMessage.value = ''

  const [guidesResult, requestsResult, invitesResult, applicationsResult] = await Promise.all([
    supabase.from('guides')
      .select('id, name, email, phone, region, published, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('requests')
      .select('id, guide_id, route_title, client_name, client_email, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('guide_invites')
      .select('token, email, note, created_at, expires_at, used_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('host_applications')
      .select('id, name, email, phone, region, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
  ])

  loading.value = false

  const failure = guidesResult.error ?? requestsResult.error ?? invitesResult.error ?? applicationsResult.error
  if (failure) {
    errorMessage.value = failure.message
    return
  }

  guides.value = guidesResult.data ?? []
  requests.value = requestsResult.data ?? []
  invites.value = invitesResult.data ?? []
  applications.value = applicationsResult.data ?? []
}

const updateApplication = async (application: ApplicationRow, status: string) => {
  errorMessage.value = ''

  const { error } = await supabase.from('host_applications').update({ status }).eq('id', application.id)
  if (error) {
    errorMessage.value = error.message
    return
  }

  application.status = status
}

// Preenche o formulário de convite com o e-mail do candidato: o convite fica
// travado nesse endereço e a candidatura já muda para "convidado".
const inviteApplicant = async (application: ApplicationRow) => {
  inviteEmail.value = application.email
  inviteNote.value = application.name
  await updateApplication(application, 'invited')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(load)

const togglePublished = async (guide: GuideRow) => {
  errorMessage.value = ''

  const { error } = await supabase.rpc('set_guide_published', {
    p_guide_id: guide.id,
    p_published: !guide.published
  })

  if (error) {
    errorMessage.value = error.message
    return
  }

  guide.published = !guide.published
}

const createInvite = async () => {
  errorMessage.value = ''
  copied.value = false
  creatingInvite.value = true

  const { data, error } = await supabase.rpc('create_guide_invite', {
    p_email: inviteEmail.value.trim() || null,
    p_note: inviteNote.value.trim() || null
  })

  creatingInvite.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  // Token no caminho, não em query string: o retorno do OAuth descartava a
  // query e o convite se perdia.
  lastInviteLink.value = `${window.location.origin}/convite/${data.token}`
  inviteEmail.value = ''
  inviteNote.value = ''
  await load()
}

const copyLink = async () => {
  await navigator.clipboard.writeText(lastInviteLink.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 2500)
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
        <NuxtLink class="active" to="/painel/admin" @click="closeMenu">Administração</NuxtLink>
        <NuxtLink to="/painel" @click="closeMenu">Visão geral</NuxtLink>
        <NuxtLink to="/painel/perfil" @click="closeMenu">Dados da guia</NuxtLink>
        <NuxtLink to="/" @click="closeMenu">Ver site público</NuxtLink>
        <button type="button" @click="signOut">Sair</button>
      </nav>
      <p>Administração da plataforma</p>
    </aside>

    <section class="admin-content">
      <header class="admin-title-row">
        <div>
          <p class="eyebrow">Plataforma</p>
          <h1>Administração</h1>
          <p>Convide guias, libere perfis para o site público e acompanhe as solicitações de todos.</p>
        </div>
        <ThemeToggle />
      </header>

      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
      <p v-if="loading" class="admin-loading">Carregando dados da plataforma…</p>

      <template v-else>
        <div class="metric-grid">
          <article><span>Anfitriões publicados</span><strong>{{ publishedCount }}</strong><small>de {{ guides.length }} cadastrados</small></article>
          <article><span>Solicitações novas</span><strong>{{ openRequests }}</strong><small>aguardando contato</small></article>
          <article><span>Em aberto</span><strong>{{ money(pipeline) }}</strong><small>soma das não recusadas</small></article>
        </div>

        <section class="request-section">
          <div class="section-heading">
            <div><p class="eyebrow">Cadastro por convite</p><h2>Convidar um anfitrião</h2></div>
          </div>

          <form class="invite-form" @submit.prevent="createInvite">
            <label class="form-field">E-mail (opcional)<input v-model="inviteEmail" type="email" placeholder="Trava o convite a este e-mail"></label>
            <label class="form-field">Anotação (opcional)<input v-model="inviteNote" type="text" placeholder="Para lembrar quem é"></label>
            <button class="button button-lime" type="submit" :disabled="creatingInvite">{{ creatingInvite ? 'Gerando…' : 'Gerar link' }}</button>
          </form>

          <div v-if="lastInviteLink" class="invite-result">
            <code>{{ lastInviteLink }}</code>
            <button class="button button-outline button-small" type="button" @click="copyLink">{{ copied ? 'Copiado' : 'Copiar' }}</button>
          </div>
          <p v-if="lastInviteLink" class="invite-hint">Vale por 14 dias e serve para um único cadastro. Envie por um canal que você confia — quem tiver o link vira guia.</p>

          <div v-if="invites.length" class="requests-table" role="table" aria-label="Convites emitidos">
            <div class="table-head table-head-invites" role="row"><span>Para</span><span>Anotação</span><span>Criado</span><span>Situação</span></div>
            <div v-for="invite in invites" :key="invite.token" class="table-row table-row-invites" role="row">
              <span>{{ invite.email || 'qualquer e-mail' }}</span>
              <span>{{ invite.note || '—' }}</span>
              <span>{{ shortDate(invite.created_at) }}</span>
              <span class="status" :class="invite.used_at ? 'confirmada' : 'nova'">{{ invite.used_at ? 'usado' : 'aberto' }}</span>
            </div>
          </div>
        </section>

        <section class="request-section">
          <div class="section-heading">
            <div><p class="eyebrow">Fila de curadoria</p><h2>Candidaturas</h2></div>
          </div>

          <p v-if="!applications.length" class="admin-loading">Nenhuma candidatura recebida ainda.</p>

          <div v-else class="requests-table" role="table" aria-label="Candidaturas a anfitrião">
            <div class="table-head table-head-apps" role="row"><span>Candidato</span><span>Onde recebe</span><span>Situação</span><span>Ações</span></div>
            <div v-for="application in applications" :key="application.id" class="table-row table-row-apps" role="row">
              <span>
                <b>{{ application.name }}</b>
                <small>{{ application.email }}<template v-if="application.phone"> · {{ application.phone }}</template></small>
                <small v-if="application.message" class="app-message">{{ application.message }}</small>
              </span>
              <span>{{ application.region || '—' }}<small>{{ shortDate(application.created_at) }}</small></span>
              <span class="status" :class="application.status">{{ APPLICATION_LABELS[application.status] ?? application.status }}</span>
              <span class="route-actions">
                <button v-if="application.status !== 'invited'" class="text-button" type="button" @click="inviteApplicant(application)">Convidar</button>
                <button v-if="application.status === 'new'" class="text-button" type="button" @click="updateApplication(application, 'contacted')">Em contato</button>
                <button v-if="application.status !== 'declined'" class="text-button danger" type="button" @click="updateApplication(application, 'declined')">Recusar</button>
              </span>
            </div>
          </div>
        </section>

        <section class="request-section">
          <div class="section-heading">
            <div><p class="eyebrow">Curadoria</p><h2>Anfitriões cadastrados</h2></div>
          </div>

          <p v-if="!guides.length" class="admin-loading">Nenhum anfitrião cadastrado ainda.</p>

          <div v-else class="requests-table" role="table" aria-label="Anfitriões cadastrados">
            <div class="table-head table-head-guides" role="row"><span>Anfitrião</span><span>Região</span><span>Entrou</span><span>Site</span></div>
            <div v-for="guide in guides" :key="guide.id" class="table-row table-row-guides" role="row">
              <span><b>{{ guide.name }}</b><small>{{ guide.email || 'sem e-mail' }}</small></span>
              <span>{{ guide.region || '—' }}</span>
              <span>{{ shortDate(guide.created_at) }}</span>
              <span>
                <button class="button button-small" :class="guide.published ? 'button-outline' : 'button-lime'" type="button" @click="togglePublished(guide)">
                  {{ guide.published ? 'Despublicar' : 'Publicar' }}
                </button>
              </span>
            </div>
          </div>
        </section>

        <section class="request-section">
          <div class="section-heading">
            <div><p class="eyebrow">Todas as guias</p><h2>Solicitações recentes</h2></div>
          </div>

          <p v-if="!requests.length" class="admin-loading">Nenhuma solicitação recebida ainda.</p>

          <div v-else class="requests-table" role="table" aria-label="Solicitações de todas as guias">
            <div class="table-head" role="row"><span>Cliente</span><span>Guia</span><span>Roteiro</span><span>Valor</span><span>Status</span></div>
            <div v-for="request in requests" :key="request.id" class="table-row" role="row">
              <span><b>{{ request.client_name }}</b><small>{{ request.client_email }}</small></span>
              <span>{{ guideName(request.guide_id) }}</span>
              <span>{{ request.route_title }}</span>
              <b>{{ money(request.total_amount) }}</b>
              <span class="status" :class="request.status">{{ REQUEST_LABELS[request.status] ?? request.status }}</span>
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

.invite-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 14px;
  align-items: end;
  margin-bottom: 16px;
}

.invite-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-solid);
}

.invite-result code {
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}

.invite-hint {
  margin: 8px 0 18px;
  color: var(--muted);
  font-size: 12px;
}

.table-head-invites,
.table-row-invites { grid-template-columns: 1.4fr 1.4fr 0.7fr 0.7fr; }

.table-head-guides,
.table-row-guides { grid-template-columns: 1.6fr 1.2fr 0.7fr 0.9fr; }

.table-head-apps,
.table-row-apps { grid-template-columns: 2fr 1fr 0.7fr 1.2fr; }

.app-message {
  display: block;
  margin-top: 4px;
  font-style: italic;
  line-height: 1.4;
}

/* Sem isto o `small` fica na mesma linha do texto acima e cola nele —
   "Vitoria-Es03 de ago." em vez de duas linhas. */
.table-row-apps span > small {
  display: block;
  margin-top: 2px;
}

.route-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.text-button.danger { color: var(--coral); }

@media (max-width: 720px) {
  .invite-form { grid-template-columns: 1fr; }
}
</style>
