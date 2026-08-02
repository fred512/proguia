<script setup lang="ts">
import type { PublicHost } from '~/composables/usePublicHosts'

const { listHosts } = usePublicHosts()

const hosts = ref<PublicHost[]>([])
const loading = ref(true)
const mobileMenuOpen = ref(false)

// Com um anfitrião só, uma listagem parece vazia. Enquanto houver apenas um,
// a chamada leva direto para a página dele; a partir de dois, para a vitrine.
const findLink = computed(() => {
  if (hosts.value.length === 1) return `/anfitriao/${hosts.value[0]!.slug}`
  return '/anfitrioes'
})

const findLabel = computed(() =>
  hosts.value.length === 1 ? 'Conhecer seu anfitrião' : 'Encontrar um anfitrião'
)

onMounted(async () => {
  const { hosts: list } = await listHosts()
  hosts.value = list
  loading.value = false
})

const closeMobileMenu = () => { mobileMenuOpen.value = false }

const scrollTo = (selector: string) => {
  closeMobileMenu()
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <main>
    <header class="site-header">
      <div class="page-width nav-bar">
        <BrandLogo />
        <nav class="main-nav" aria-label="Navegação principal">
          <div class="desktop-nav">
            <button type="button" @click="scrollTo('#como-funciona')">Como funciona</button>
            <NuxtLink :to="findLink">Anfitriões</NuxtLink>
            <NuxtLink to="/quero-ser-anfitriao">Seja um anfitrião</NuxtLink>
            <ThemeToggle />
          </div>
          <div class="mobile-nav-actions">
            <ThemeToggle />
            <button class="mobile-menu-trigger" type="button" aria-controls="mobile-site-menu" :aria-expanded="mobileMenuOpen" aria-label="Abrir menu" @click="mobileMenuOpen = !mobileMenuOpen"><span /><span /><span /></button>
          </div>
          <div id="mobile-site-menu" class="mobile-site-menu" :class="{ 'is-open': mobileMenuOpen }">
            <button type="button" @click="scrollTo('#como-funciona')">Como funciona</button>
            <NuxtLink :to="findLink" @click="closeMobileMenu">Anfitriões</NuxtLink>
            <NuxtLink to="/quero-ser-anfitriao" @click="closeMobileMenu">Seja um anfitrião <span aria-hidden="true">→</span></NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <section class="hero page-width">
      <div class="hero-copy">
        <p class="eyebrow">Experiências privadas · Tríplice Fronteira</p>
        <h1>Viaje com <span>alguém</span> <em>que mora lá.</em></h1>
        <p class="hero-description">O PersonalTravel conecta você a anfitriões locais da Tríplice Fronteira. Nada de excursão com cinquenta pessoas: o roteiro é montado para o ritmo, os interesses e o tamanho do seu grupo.</p>
        <div class="hero-actions">
          <NuxtLink class="button button-lime" :to="findLink">{{ findLabel }} <span aria-hidden="true">→</span></NuxtLink>
          <button class="button button-quiet" type="button" @click="scrollTo('#como-funciona')">Como funciona</button>
        </div>
        <div class="hero-points"><span>Sem roteiro engessado</span><span>Grupos privados</span><span>Transporte em breve</span></div>
      </div>
      <div class="hero-visual" aria-label="Cataratas do Iguaçu">
        <img src="https://commons.wikimedia.org/wiki/Special:FilePath/1%20iguazu%20falls.jpg?width=1200" alt="Cataratas do Iguaçu">
        <div class="hero-sticker">Seu grupo.<br>Seu ritmo.</div>
        <div class="hero-bubble"><span>✦</span> Gente local<br><strong>sem fórmula pronta.</strong></div>
        <a class="hero-credit" href="https://commons.wikimedia.org/wiki/File:1_iguazu_falls.jpg" target="_blank" rel="noopener noreferrer">foto: chensiyuan · CC BY-SA 4.0</a>
      </div>
    </section>

    <section id="como-funciona" class="how-section page-width">
      <div class="how-copy">
        <p class="eyebrow">Um pedido, não uma reserva automática</p>
        <h2>Você diz o essencial. Seu anfitrião responde com a proposta.</h2>
      </div>
      <ol class="steps-list">
        <li><span>01</span><strong>Escolha um anfitrião</strong><p>Veja quem atende a região e o que cada um oferece.</p></li>
        <li><span>02</span><strong>Escolha um roteiro</strong><p>Informe a data, quantos dias e quantas pessoas.</p></li>
        <li><span>03</span><strong>Envie seu contato</strong><p>A solicitação chega direto para quem vai te receber.</p></li>
      </ol>
    </section>

    <section class="doors-section">
      <div class="page-width doors-grid">
        <article class="door">
          <p class="eyebrow">Para quem viaja</p>
          <h2>Encontre quem conhece de verdade</h2>
          <p>Anfitriões que moram na Tríplice Fronteira, atendem em português e espanhol, e recebem grupos pequenos.</p>
          <p v-if="loading" class="door-status">Carregando anfitriões…</p>
          <p v-else-if="!hosts.length" class="door-status">Estamos selecionando os primeiros anfitriões. Volte em breve.</p>
          <NuxtLink v-else class="button button-lime" :to="findLink">{{ findLabel }} <span aria-hidden="true">→</span></NuxtLink>
        </article>

        <article class="door door-quiet">
          <p class="eyebrow">Para quem recebe</p>
          <h2>Receba viajantes do seu jeito</h2>
          <p>O cadastro é por convite: você se candidata, a gente conversa, e só então seu perfil entra no ar. É assim que a curadoria se mantém.</p>
          <NuxtLink class="button button-outline" to="/quero-ser-anfitriao">Quero ser anfitrião <span aria-hidden="true">→</span></NuxtLink>
        </article>
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
.hero-credit {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 3px 7px;
  border-radius: 7px;
  background: #15221ecc;
  color: #cfd8dc;
  font-size: 10px;
  text-decoration: none;
}

.hero-credit:hover { text-decoration: underline; }

.doors-section { padding: 20px 0 60px; }

.doors-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.door {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 30px 28px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-solid);
}

.door h2 {
  margin: 0;
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 27px;
  line-height: 1.02;
  letter-spacing: -0.03em;
}

.door p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.55; }

.door .button { margin-top: 6px; }

.door-status { font-size: 13px; }

@media (max-width: 860px) {
  .doors-grid { grid-template-columns: 1fr; }
}
</style>
