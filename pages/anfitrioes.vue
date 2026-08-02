<script setup lang="ts">
import type { PublicHost } from '~/composables/usePublicHosts'

useHead({ title: 'Anfitriões — PersonalTravel' })

const { listHosts } = usePublicHosts()

const hosts = ref<PublicHost[]>([])
const loading = ref(true)
const errorMessage = ref('')
const regionFilter = ref('')
const mobileMenuOpen = ref(false)

const regions = computed(() => {
  const unique = new Set(hosts.value.map((host) => host.region).filter(Boolean))
  return [...unique].sort()
})

const visibleHosts = computed(() =>
  regionFilter.value
    ? hosts.value.filter((host) => host.region === regionFilter.value)
    : hosts.value
)

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')

onMounted(async () => {
  const { hosts: list, error } = await listHosts()
  hosts.value = list
  errorMessage.value = error
  loading.value = false
})

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
            <NuxtLink to="/quero-ser-anfitriao">Seja um anfitrião</NuxtLink>
            <ThemeToggle />
          </div>
          <div class="mobile-nav-actions">
            <ThemeToggle />
            <button class="mobile-menu-trigger" type="button" aria-controls="mobile-site-menu" :aria-expanded="mobileMenuOpen" aria-label="Abrir menu" @click="mobileMenuOpen = !mobileMenuOpen"><span /><span /><span /></button>
          </div>
          <div id="mobile-site-menu" class="mobile-site-menu" :class="{ 'is-open': mobileMenuOpen }">
            <NuxtLink to="/" @click="closeMobileMenu">Início</NuxtLink>
            <NuxtLink to="/quero-ser-anfitriao" @click="closeMobileMenu">Seja um anfitrião <span aria-hidden="true">→</span></NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <section class="page-width hosts-page">
      <div class="section-heading wide-heading">
        <div>
          <p class="eyebrow">Quem recebe você</p>
          <h2>Escolha seu anfitrião.</h2>
        </div>
        <p>Cada um monta o roteiro do seu jeito. Você conversa direto com quem vai te acompanhar.</p>
      </div>

      <div v-if="regions.length > 1" class="region-filter">
        <button type="button" :class="{ active: !regionFilter }" @click="regionFilter = ''">Todas as regiões</button>
        <button v-for="region in regions" :key="region" type="button" :class="{ active: regionFilter === region }" @click="regionFilter = region">{{ region }}</button>
      </div>

      <p v-if="loading" class="hosts-status">Carregando anfitriões…</p>
      <p v-else-if="errorMessage" class="hosts-status hosts-error">{{ errorMessage }}</p>
      <p v-else-if="!hosts.length" class="hosts-status">
        Ainda estamos selecionando os primeiros anfitriões. Se você recebe visitantes na Tríplice Fronteira,
        <NuxtLink to="/quero-ser-anfitriao">candidate-se</NuxtLink>.
      </p>
      <p v-else-if="!visibleHosts.length" class="hosts-status">Nenhum anfitrião nessa região por enquanto.</p>

      <div v-else class="hosts-grid">
        <NuxtLink v-for="host in visibleHosts" :key="host.id" class="host-card" :to="`/anfitriao/${host.slug}`">
          <div class="host-photo">
            <img v-if="host.photo_url" :src="host.photo_url" :alt="host.name">
            <span v-else aria-hidden="true">{{ initials(host.name) }}</span>
          </div>
          <div class="host-body">
            <h3>{{ host.name }}</h3>
            <p v-if="host.region" class="host-region">{{ host.region }}</p>
            <p v-if="host.bio" class="host-bio">{{ host.bio }}</p>
            <div class="host-tags">
              <span v-if="host.languages">{{ host.languages }}</span>
              <span>até {{ host.group_limit }} pessoas</span>
            </div>
            <span class="host-link">Ver roteiros <span aria-hidden="true">→</span></span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <footer class="site-footer">
      <div class="page-width footer-row">
        <BrandLogo />
        <span>PersonalTravel · Transporte ainda não incluso.</span>
        <NuxtLink to="/painel">Área do anfitrião</NuxtLink>
        <span>© {{ new Date().getFullYear() }}</span>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.hosts-page { padding: 130px 0 60px; }

.region-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }

.region-filter button {
  padding: 7px 13px;
  border: 1px solid var(--line);
  border-radius: 99px;
  background: var(--panel-solid);
  color: var(--ink-soft);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.region-filter button.active {
  background: var(--lime);
  border-color: var(--lime);
  color: #16201b;
}

.hosts-status { color: var(--muted); font-size: 14px; }
.hosts-error { color: var(--coral); }

.hosts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.host-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--panel-solid);
  color: inherit;
  text-decoration: none;
  transition: transform 0.16s ease;
}

.host-card:hover { transform: translateY(-3px); }

.host-photo { height: 190px; background: var(--paper-strong); }
.host-photo img { width: 100%; height: 100%; object-fit: cover; }

.host-photo span {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--muted);
  font-size: 34px;
  font-weight: 600;
}

.host-body { display: flex; flex-direction: column; gap: 7px; padding: 18px; }

.host-body h3 {
  margin: 0;
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 22px;
  letter-spacing: -0.03em;
}

.host-region { margin: 0; color: var(--muted); font-size: 12px; font-weight: 600; }

.host-bio {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.host-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }

.host-tags span {
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: 99px;
  background: var(--paper);
  font-size: 10px;
  font-weight: 800;
}

.host-link { margin-top: 6px; color: var(--coral); font-size: 13px; font-weight: 700; }
</style>
