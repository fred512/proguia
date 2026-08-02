<script setup lang="ts">
import type { TravelRoute } from '~/components/RouteCard.vue'
import type { PublicHost } from '~/composables/usePublicHosts'

const route = useRoute()
const supabase = useSupabase()
const { getHost, getRoutes } = usePublicHosts()

type Package = { name: string, multiplier: number, description: string }

const host = ref<PublicHost | null>(null)
const routes = ref<TravelRoute[]>([])
const packages = ref<Package[]>([])
const loading = ref(true)
const notFound = ref(false)
const mobileMenuOpen = ref(false)

const selectedRoute = ref<TravelRoute | null>(null)
const galleryRoute = ref<TravelRoute | null>(null)
const bookingOpen = ref(false)
const bookingStep = ref(1)
const submitting = ref(false)
const submitError = ref('')
const confirmedTotal = ref(0)

const booking = reactive({ days: 2, people: 2, date: '', package: 'Essencial', name: '', email: '', phone: '' })

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))

const multiplierOf = (name: string) =>
  packages.value.find((item) => item.name === name)?.multiplier ?? 1

// Prévia apenas. O valor que vale é o que o RPC devolve — ele recalcula a
// partir de routes.price_per_day e packages.multiplier no servidor.
const previewTotal = computed(() =>
  selectedRoute.value
    ? Math.round(selectedRoute.value.price_per_day * booking.days * multiplierOf(booking.package))
    : 0
)

const initials = computed(() =>
  (host.value?.name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
)

onMounted(async () => {
  const slug = String(route.params.slug ?? '')
  const { host: found } = await getHost(slug)

  if (!found) {
    notFound.value = true
    loading.value = false
    return
  }

  host.value = found
  useHead({ title: `${found.name} — PersonalTravel` })

  const [{ routes: list }, packagesResult] = await Promise.all([
    getRoutes(found.id),
    supabase.from('packages').select('name, multiplier, description').order('position')
  ])

  routes.value = list
  packages.value = (packagesResult.data ?? []) as Package[]
  loading.value = false
})

const openBooking = (target: TravelRoute) => {
  selectedRoute.value = target
  galleryRoute.value = null
  bookingStep.value = 1
  submitError.value = ''
  bookingOpen.value = true
}

const closeBooking = () => { bookingOpen.value = false }

const choosePackage = (name: string) => {
  booking.package = name
  bookingStep.value = 3
}

const submitRequest = async () => {
  if (!selectedRoute.value) return

  submitError.value = ''
  submitting.value = true

  const { data, error } = await supabase.rpc('create_request', {
    p_route_id: selectedRoute.value.id,
    p_package: booking.package,
    p_days: booking.days,
    p_people: booking.people,
    p_start_date: booking.date || null,
    p_client_name: booking.name,
    p_client_email: booking.email,
    p_client_phone: booking.phone
  })

  submitting.value = false

  if (error) {
    submitError.value = error.message
    return
  }

  confirmedTotal.value = Number(data?.total_amount ?? 0)
  bookingStep.value = 4
}

const closeMobileMenu = () => { mobileMenuOpen.value = false }
</script>

<template>
  <main>
    <header class="site-header">
      <div class="page-width nav-bar">
        <BrandLogo />
        <nav class="main-nav" aria-label="Navegação principal">
          <div class="desktop-nav">
            <NuxtLink to="/">Início</NuxtLink>
            <NuxtLink to="/anfitrioes">Anfitriões</NuxtLink>
            <ThemeToggle />
          </div>
          <div class="mobile-nav-actions">
            <ThemeToggle />
            <button class="mobile-menu-trigger" type="button" aria-controls="mobile-site-menu" :aria-expanded="mobileMenuOpen" aria-label="Abrir menu" @click="mobileMenuOpen = !mobileMenuOpen"><span /><span /><span /></button>
          </div>
          <div id="mobile-site-menu" class="mobile-site-menu" :class="{ 'is-open': mobileMenuOpen }">
            <NuxtLink to="/" @click="closeMobileMenu">Início</NuxtLink>
            <NuxtLink to="/anfitrioes" @click="closeMobileMenu">Anfitriões</NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <p v-if="loading" class="page-width host-status">Carregando…</p>

    <section v-else-if="notFound" class="page-width host-status">
      <h1>Anfitrião não encontrado</h1>
      <p>Este endereço não corresponde a nenhum anfitrião publicado.</p>
      <NuxtLink class="button button-lime" to="/anfitrioes">Ver anfitriões <span aria-hidden="true">→</span></NuxtLink>
    </section>

    <template v-else-if="host">
      <section class="guide-section host-hero">
        <div class="page-width guide-layout">
          <div class="guide-image-wrap">
            <img v-if="host.photo_url" :src="host.photo_url" :alt="host.name">
            <span v-else class="host-initials" aria-hidden="true">{{ initials }}</span>
            <span>{{ host.name }}</span>
          </div>
          <div class="guide-copy">
            <p class="eyebrow">Quem vai com você</p>
            <h1>{{ host.name }}</h1>
            <p v-if="host.region" class="host-region">{{ host.region }}</p>
            <p v-if="host.bio">{{ host.bio }}</p>
            <div class="tag-list">
              <span v-if="host.languages">{{ host.languages }}</span>
              <span>Grupos de até {{ host.group_limit }} pessoas</span>
            </div>
          </div>
        </div>
      </section>

      <section id="roteiros" class="routes-section">
        <div class="page-width">
          <div class="section-heading wide-heading">
            <div>
              <p class="eyebrow">Escolha seu ponto de partida</p>
              <h2>Roteiros de {{ host.name.split(' ')[0] }}.</h2>
            </div>
            <p>As imagens são inspiração: depois você escolhe os dias e a proposta é montada para o seu grupo.</p>
          </div>

          <p v-if="!routes.length" class="host-status">Este anfitrião ainda não publicou roteiros.</p>

          <div v-else class="route-grid">
            <RouteCard v-for="item in routes" :key="item.id" :route="item" @gallery="galleryRoute = $event" @choose="openBooking" />
          </div>
        </div>
      </section>
    </template>

    <footer class="site-footer">
      <div class="page-width footer-row">
        <BrandLogo />
        <span>PersonalTravel · Transporte ainda não incluso.</span>
        <NuxtLink to="/painel">Área do anfitrião</NuxtLink>
        <span>© {{ new Date().getFullYear() }}</span>
      </div>
    </footer>

    <RouteGallery :route="galleryRoute" @close="galleryRoute = null" @choose="openBooking" />

    <div v-if="bookingOpen && selectedRoute" class="dialog-backdrop" role="presentation" @click.self="closeBooking">
      <section class="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <header class="dialog-header">
          <div>
            <p class="eyebrow">Monte sua solicitação</p>
            <h2 id="booking-title">{{ bookingStep === 4 ? 'Pedido enviado' : selectedRoute.title }}</h2>
          </div>
          <button class="icon-button" type="button" aria-label="Fechar pedido" @click="closeBooking">×</button>
        </header>

        <div v-if="bookingStep < 4" class="progress"><span v-for="step in 3" :key="step" :class="{ active: bookingStep >= step }"></span></div>

        <div v-if="bookingStep === 1" class="booking-content">
          <p class="dialog-intro">A experiência parte de {{ money(selectedRoute.price_per_day) }} por dia para o grupo inteiro, com até {{ selectedRoute.capacity }} pessoas.</p>
          <label class="form-field">Data de início<input v-model="booking.date" type="date"></label>
          <div class="field-row">
            <label class="form-field">Quantos dias?<input v-model.number="booking.days" type="number" min="1" max="30"></label>
            <label class="form-field">Pessoas no grupo<input v-model.number="booking.people" type="number" min="1" :max="selectedRoute.capacity"></label>
          </div>
          <p v-if="booking.people > selectedRoute.capacity" class="form-alert">Este roteiro comporta até {{ selectedRoute.capacity }} pessoas. Ajuste o grupo para continuar.</p>
          <button class="button button-lime full-button" type="button" :disabled="booking.days < 1 || booking.people < 1 || booking.people > selectedRoute.capacity" @click="bookingStep = 2">Ver opções de pacote <span aria-hidden="true">→</span></button>
        </div>

        <div v-else-if="bookingStep === 2" class="booking-content">
          <p class="dialog-intro">Escolha o nível de acompanhamento. O valor é sempre por grupo e não inclui transporte nesta fase.</p>
          <div class="package-list">
            <button v-for="pack in packages" :key="pack.name" class="package-card" type="button" @click="choosePackage(pack.name)">
              <span>{{ pack.name }}</span>
              <strong>{{ money(Math.round(selectedRoute.price_per_day * booking.days * pack.multiplier)) }}</strong>
              <small>{{ pack.description }}</small>
              <i>Selecionar →</i>
            </button>
          </div>
          <button class="text-button" type="button" @click="bookingStep = 1">← Voltar aos dias</button>
        </div>

        <div v-else-if="bookingStep === 3" class="booking-content">
          <div class="booking-summary">
            <span>{{ selectedRoute.title }} · {{ booking.days }} dia(s) · {{ booking.people }} pessoa(s)</span>
            <strong>{{ booking.package }} · {{ money(previewTotal) }}</strong>
          </div>
          <label class="form-field">Seu nome<input v-model="booking.name" type="text" placeholder="Como podemos te chamar?"></label>
          <div class="field-row">
            <label class="form-field">E-mail<input v-model="booking.email" type="email" placeholder="voce@email.com"></label>
            <label class="form-field">Telefone para contato<input v-model="booking.phone" type="tel" placeholder="(00) 00000-0000"></label>
          </div>
          <p v-if="submitError" class="form-alert">{{ submitError }}</p>
          <button class="button button-lime full-button" type="button" :disabled="submitting || !booking.name || !booking.email || !booking.phone" @click="submitRequest">
            {{ submitting ? 'Enviando…' : 'Concluir solicitação' }} <span v-if="!submitting" aria-hidden="true">→</span>
          </button>
          <button class="text-button" type="button" @click="bookingStep = 2">← Escolher outro pacote</button>
        </div>

        <div v-else class="confirmation-content">
          <div class="confirmation-symbol">✓</div>
          <p class="eyebrow">Solicitação registrada</p>
          <h3>Obrigado, {{ booking.name }}!</h3>
          <p>{{ host?.name }} recebeu seu pedido e vai responder no e-mail informado. Isto é um pedido de proposta, não uma reserva confirmada.</p>
          <div class="booking-summary">
            <span>{{ selectedRoute.title }} · {{ booking.days }} dia(s)</span>
            <strong>{{ money(confirmedTotal) }}</strong>
          </div>
          <button class="button button-lime full-button" type="button" @click="closeBooking">Voltar</button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.host-hero { padding-top: 130px; }

.host-status {
  padding: 130px 0 60px;
  color: var(--muted);
  font-size: 14px;
}

.host-status h1 {
  margin: 0 0 8px;
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 34px;
  color: var(--ink);
}

.host-status .button { margin-top: 16px; }

.host-region { color: var(--muted); font-size: 13px; font-weight: 700; }

.host-initials {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--paper-strong);
  color: var(--muted);
  font-size: 54px;
  font-weight: 600;
}
</style>
