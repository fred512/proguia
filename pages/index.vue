<script setup lang="ts">
import type { TravelRoute } from '~/components/RouteCard.vue'

const routes: TravelRoute[] = [
  {
    id: 'compras',
    title: 'Compras sem pressa',
    category: 'Compras',
    price: 320,
    capacity: 6,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Paris%20105451%20HDR.jpg?width=1200',
    description: 'Curadoria de lojas, shoppings e achados em Ciudad del Este, no ritmo do seu grupo.',
    highlights: ['Shopping Paris', 'Cellshop', 'SAX Department Store'],
    gallery: [
      { label: 'Shopping Paris', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Paris%20105451%20HDR.jpg?width=1200' },
      { label: 'Shopping del Este', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Del%20Este%20%28Ciudad%20Del%20Este%29%2C%20Paraguay.jpg?width=1200' },
      { label: 'Cellshop', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cell%20Shop%20081117%20HDR.jpg?width=1200' },
      { label: 'SAX', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/SAX%20105148.jpg?width=1200' }
    ]
  },
  {
    id: 'turismo',
    title: 'Gigantes da fronteira',
    category: 'Turismo',
    price: 390,
    capacity: 6,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam.jpg?width=1200',
    description: 'Paisagens, histórias e símbolos da região guiados por quem realmente conhece cada detalhe.',
    highlights: ['Itaipu Binacional', 'Marco das Três Fronteiras', 'Cataratas'],
    gallery: [
      { label: 'Itaipu Binacional', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam.jpg?width=1200' },
      { label: 'Marco das Três Fronteiras', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hito%20de%20las%20Tres%20Fronteras%20PARAGUAY.jpg?width=1200' },
      { label: 'Cataratas do Iguaçu', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Iguaz%C3%BA%20falls.jpg?width=1200' },
      { label: 'Itaipu panorâmica', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam%20-b.jpg?width=1200' }
    ]
  },
  {
    id: 'combinado',
    title: 'O melhor dos dois mundos',
    category: 'Turismo + Compras',
    price: 450,
    capacity: 5,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/1%20iguazu%20falls.jpg?width=1200',
    description: 'Uma experiência equilibrada entre descobertas, paisagens marcantes e compras inteligentes.',
    highlights: ['Ciudad del Este', 'Itaipu Binacional', 'Marco das Três Fronteiras'],
    gallery: [
      { label: 'Cataratas do Iguaçu', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/1%20iguazu%20falls.jpg?width=1200' },
      { label: 'Itaipu Binacional', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Itaipu%20Dam.jpg?width=1200' },
      { label: 'Shopping del Este', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shopping%20Del%20Este%20%28Ciudad%20Del%20Este%29%2C%20Paraguay.jpg?width=1200' },
      { label: 'Marco das Três Fronteiras', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hito%20de%20las%20Tres%20Fronteras%20PARAGUAY.jpg?width=1200' }
    ]
  }
]

const selectedRoute = ref<TravelRoute | null>(null)
const galleryRoute = ref<TravelRoute | null>(null)
const bookingOpen = ref(false)
const bookingStep = ref(1)
const booking = reactive({ days: 2, people: 2, date: '', package: 'Essencial', name: '', email: '', phone: '' })
const mobileMenuOpen = ref(false)

const closeMobileMenu = () => { mobileMenuOpen.value = false }
const scrollToRoutes = () => { closeMobileMenu(); document.querySelector('#roteiros')?.scrollIntoView({ behavior: 'smooth' }) }
const scrollToGuide = () => { closeMobileMenu(); document.querySelector('#guia')?.scrollIntoView({ behavior: 'smooth' }) }
const openBooking = (route: TravelRoute) => {
  selectedRoute.value = route
  galleryRoute.value = null
  bookingStep.value = 1
  bookingOpen.value = true
}
const closeBooking = () => { bookingOpen.value = false }
const choosePackage = (name: string) => { booking.package = name; bookingStep.value = 3 }
const packageMultiplier: Record<string, number> = { Essencial: 1, Conforto: 1.2, Completo: 1.35 }
const total = computed(() => selectedRoute.value ? Math.round(selectedRoute.value.price * booking.days * packageMultiplier[booking.package]) : 0)
const perDay = computed(() => selectedRoute.value ? Math.round(selectedRoute.value.price * packageMultiplier[booking.package]) : 0)
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
const submitRequest = () => { bookingStep.value = 4 }
</script>

<template>
  <main>
    <header class="site-header">
      <div class="page-width nav-bar">
        <BrandLogo />
        <nav class="main-nav" aria-label="Navegação principal">
          <div class="desktop-nav">
            <button type="button" @click="scrollToRoutes">Roteiros</button>
            <button type="button" @click="scrollToGuide">A guia</button>
            <NuxtLink to="/painel">Painel da guia</NuxtLink>
            <ThemeToggle />
          </div>
          <div class="mobile-nav-actions">
            <ThemeToggle />
            <button class="mobile-menu-trigger" type="button" aria-controls="mobile-site-menu" :aria-expanded="mobileMenuOpen" aria-label="Abrir menu" @click="mobileMenuOpen = !mobileMenuOpen"><span /><span /><span /></button>
          </div>
          <div id="mobile-site-menu" class="mobile-site-menu" :class="{ 'is-open': mobileMenuOpen }">
            <button type="button" @click="scrollToRoutes">Roteiros</button>
            <button type="button" @click="scrollToGuide">Conhecer a guia</button>
            <NuxtLink to="/painel" @click="closeMobileMenu">Painel da guia <span aria-hidden="true">→</span></NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <section class="hero page-width">
      <div class="hero-copy">
        <p class="eyebrow">Experiências privadas · Paraguai</p>
        <h1>Descubra o <span>Paraguai</span> <em>do seu jeito.</em></h1>
        <p class="hero-description">Roteiros pessoais pela Tríplice Fronteira, planejados para o ritmo, os interesses e o tamanho do seu grupo.</p>
        <div class="hero-actions">
          <button class="button button-lime" type="button" @click="scrollToRoutes">Montar meu passeio <span aria-hidden="true">→</span></button>
          <button class="button button-quiet" type="button" @click="scrollToGuide">Conhecer a guia</button>
        </div>
        <div class="hero-points"><span>Sem roteiro engessado</span><span>Grupos privados</span><span>Transporte em breve</span></div>
      </div>
      <div class="hero-visual" aria-label="Cataratas do Iguaçu">
        <img src="https://commons.wikimedia.org/wiki/Special:FilePath/1%20iguazu%20falls.jpg?width=1200" alt="Cataratas do Iguaçu">
        <div class="hero-sticker">Seu grupo.<br>Seu ritmo.</div>
        <div class="hero-bubble"><span>✦</span> Experiência local<br><strong>sem fórmula pronta.</strong></div>
      </div>
    </section>

    <section id="roteiros" class="routes-section">
      <div class="page-width">
        <div class="section-heading wide-heading">
          <div>
            <p class="eyebrow">Escolha seu ponto de partida</p>
            <h2>Comece pela experiência que mais combina com você.</h2>
          </div>
          <p>As imagens são inspiração: depois você escolhe os dias e a proposta é montada para o seu grupo.</p>
        </div>
        <div class="route-grid">
          <RouteCard v-for="route in routes" :key="route.id" :route="route" @gallery="galleryRoute = $event" @choose="openBooking" />
        </div>
      </div>
    </section>

    <section class="how-section page-width">
      <div class="how-copy"><p class="eyebrow">Um pedido, não uma reserva automática</p><h2>Você diz o essencial. A Marcia retorna com a proposta ideal.</h2></div>
      <ol class="steps-list">
        <li><span>01</span><strong>Escolha um roteiro</strong><p>Veja fotos e defina sua inspiração.</p></li>
        <li><span>02</span><strong>Informe os dias</strong><p>Conte quando e com quantas pessoas.</p></li>
        <li><span>03</span><strong>Envie seu contato</strong><p>A solicitação chega para a guia.</p></li>
      </ol>
    </section>

    <section id="guia" class="guide-section">
      <div class="page-width guide-layout">
        <div class="guide-image-wrap"><img src="/images/marcia-marianno-machado.jpg" alt="Marcia Marianno Machado nas Cataratas do Iguaçu"><span>Marcia Marianno Machado</span></div>
        <div class="guide-copy">
          <p class="eyebrow">Quem vai com você</p>
          <h2>Olá, sou a Marcia.</h2>
          <blockquote>“Meu trabalho é fazer você se sentir menos turista e mais convidado.”</blockquote>
          <p>Guia local especializada na Tríplice Fronteira, com atendimento em português e espanhol. Cada passeio é planejado com atenção ao perfil do grupo — sem correria e sem fórmulas prontas.</p>
          <div class="tag-list"><span>Português + Español</span><span>Compras conscientes</span><span>História local</span><span>Grupos de até 6 pessoas</span></div>
        </div>
      </div>
    </section>

    <footer class="site-footer"><div class="page-width footer-row"><BrandLogo /><span>Protótipo ProGuia · Transporte ainda não incluso.</span><span>© {{ new Date().getFullYear() }}</span></div></footer>

    <RouteGallery :route="galleryRoute" @close="galleryRoute = null" @choose="openBooking" />

    <div v-if="bookingOpen && selectedRoute" class="dialog-backdrop" role="presentation" @click.self="closeBooking">
      <section class="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <header class="dialog-header">
          <div><p class="eyebrow">Monte sua solicitação</p><h2 id="booking-title">{{ bookingStep === 4 ? 'Pedido enviado' : selectedRoute.title }}</h2></div>
          <button class="icon-button" type="button" aria-label="Fechar pedido" @click="closeBooking">×</button>
        </header>
        <div v-if="bookingStep < 4" class="progress"><span v-for="step in 3" :key="step" :class="{ active: bookingStep >= step }"></span></div>

        <div v-if="bookingStep === 1" class="booking-content">
          <p class="dialog-intro">A experiência parte de {{ money(selectedRoute.price) }} por dia para o grupo inteiro, com até {{ selectedRoute.capacity }} pessoas.</p>
          <label class="form-field">Data de início<input v-model="booking.date" type="date"></label>
          <div class="field-row"><label class="form-field">Quantos dias?<input v-model.number="booking.days" type="number" min="1" max="14"></label><label class="form-field">Pessoas no grupo<input v-model.number="booking.people" type="number" min="1" :max="selectedRoute.capacity"></label></div>
          <p v-if="booking.people > selectedRoute.capacity" class="form-alert">Este roteiro comporta até {{ selectedRoute.capacity }} pessoas. Ajuste o grupo para continuar.</p>
          <button class="button button-lime full-button" type="button" :disabled="booking.days < 1 || booking.people < 1 || booking.people > selectedRoute.capacity" @click="bookingStep = 2">Ver opções de pacote <span aria-hidden="true">→</span></button>
        </div>

        <div v-else-if="bookingStep === 2" class="booking-content">
          <p class="dialog-intro">Escolha o nível de acompanhamento. O valor é sempre por grupo e não inclui transporte nesta fase.</p>
          <div class="package-list">
            <button v-for="pack in [{ name: 'Essencial', factor: 1, text: 'Curadoria de roteiro e acompanhamento da guia.' }, { name: 'Conforto', factor: 1.2, text: 'Mais flexibilidade e organização prévia de paradas.' }, { name: 'Completo', factor: 1.35, text: 'Atenção ampliada aos detalhes do grupo.' }]" :key="pack.name" class="package-card" type="button" @click="choosePackage(pack.name)">
              <span>{{ pack.name }}</span><strong>{{ money(Math.round(selectedRoute.price * booking.days * pack.factor)) }}</strong><small>{{ pack.text }}</small><i>Selecionar →</i>
            </button>
          </div>
          <button class="text-button" type="button" @click="bookingStep = 1">← Voltar aos dias</button>
        </div>

        <div v-else-if="bookingStep === 3" class="booking-content">
          <div class="booking-summary"><span>{{ selectedRoute.title }} · {{ booking.days }} dia(s) · {{ booking.people }} pessoa(s)</span><strong>{{ booking.package }} · {{ money(total) }}</strong></div>
          <label class="form-field">Seu nome<input v-model="booking.name" type="text" placeholder="Como podemos te chamar?"></label>
          <div class="field-row"><label class="form-field">E-mail<input v-model="booking.email" type="email" placeholder="voce@email.com"></label><label class="form-field">Telefone para contato<input v-model="booking.phone" type="tel" placeholder="(00) 00000-0000"></label></div>
          <button class="button button-lime full-button" type="button" :disabled="!booking.name || !booking.email || !booking.phone" @click="submitRequest">Concluir solicitação <span aria-hidden="true">→</span></button>
          <button class="text-button" type="button" @click="bookingStep = 2">← Escolher outro pacote</button>
        </div>

        <div v-else class="confirmation-content">
          <div class="confirmation-symbol">✓</div>
          <p class="eyebrow">Solicitação registrada</p>
          <h3>Obrigada, {{ booking.name }}!</h3>
          <p>Na versão final, os dados seguirão por e-mail para a Marcia. Por enquanto, esta confirmação demonstra o fluxo do app.</p>
          <div class="booking-summary"><span>{{ selectedRoute.title }} · {{ booking.days }} dia(s)</span><strong>{{ money(total) }}</strong></div>
          <button class="button button-lime full-button" type="button" @click="closeBooking">Voltar ao início</button>
        </div>
      </section>
    </div>
  </main>
</template>
