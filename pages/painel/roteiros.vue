<script setup lang="ts">
import type { CommonsImage } from '~/composables/useCommonsSearch'

definePageMeta({ middleware: 'auth' })

const { user, isAdmin, signOut } = useAuth()
const supabase = useSupabase()
const { uploadImage } = useImageUpload()
const { results: commonsResults, searching, searchError, search: searchCommons, COMMONS_SUGGESTIONS } = useCommonsSearch()

// credit/license/source só existem em foto vinda do Commons. As licenças de lá
// (CC BY-SA, FAL) obrigam atribuição, então o crédito viaja junto com a imagem
// e é exibido na página pública.
type GalleryItem = {
  label: string
  image: string
  credit?: string
  license?: string
  source?: string
}

type RouteRow = {
  id: string
  title: string
  category: string
  description: string
  price_per_day: number
  capacity: number
  cover_image: string | null
  highlights: string[]
  gallery: GalleryItem[]
  active: boolean
  position: number
}

const routes = ref<RouteRow[]>([])
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const menuOpen = ref(false)

const blank = () => ({
  id: '',
  title: '',
  category: '',
  description: '',
  price_per_day: 300,
  capacity: 6,
  cover_image: '',
  highlightsText: '',
  gallery: [] as GalleryItem[],
  active: true
})

const draft = reactive(blank())
const editing = computed(() => Boolean(draft.id))

const coverInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))

const load = async () => {
  if (!user.value) return

  const { data, error } = await supabase
    .from('routes')
    .select('id, title, category, description, price_per_day, capacity, cover_image, highlights, gallery, active, position')
    .eq('guide_id', user.value.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  routes.value = (data ?? []) as RouteRow[]
}

onMounted(load)

const resetDraft = () => Object.assign(draft, blank())

const editRoute = (route: RouteRow) => {
  Object.assign(draft, {
    id: route.id,
    title: route.title,
    category: route.category ?? '',
    description: route.description ?? '',
    price_per_day: Number(route.price_per_day),
    capacity: route.capacity,
    cover_image: route.cover_image ?? '',
    highlightsText: (route.highlights ?? []).join(', '),
    gallery: [...(route.gallery ?? [])],
    active: route.active
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const saveRoute = async () => {
  if (!user.value) return

  errorMessage.value = ''

  if (!draft.title.trim()) {
    errorMessage.value = 'Dê um nome ao roteiro.'
    return
  }
  if (draft.price_per_day <= 0) {
    errorMessage.value = 'O valor por dia precisa ser maior que zero.'
    return
  }

  saving.value = true

  const payload = {
    guide_id: user.value.id,
    title: draft.title.trim(),
    category: draft.category.trim(),
    description: draft.description.trim(),
    price_per_day: draft.price_per_day,
    capacity: draft.capacity,
    cover_image: draft.cover_image.trim() || null,
    highlights: draft.highlightsText.split(',').map((item) => item.trim()).filter(Boolean),
    gallery: draft.gallery,
    active: draft.active
  }

  const { error } = draft.id
    ? await supabase.from('routes').update(payload).eq('id', draft.id)
    : await supabase.from('routes').insert(payload)

  saving.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  resetDraft()
  await load()
}

const removeRoute = async (route: RouteRow) => {
  errorMessage.value = ''

  const { error } = await supabase.from('routes').delete().eq('id', route.id)
  if (error) {
    errorMessage.value = error.message
    return
  }

  if (draft.id === route.id) resetDraft()
  await load()
}

const toggleActive = async (route: RouteRow) => {
  errorMessage.value = ''

  const { error } = await supabase.from('routes').update({ active: !route.active }).eq('id', route.id)
  if (error) {
    errorMessage.value = error.message
    return
  }

  route.active = !route.active
}

const uploadCover = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  errorMessage.value = ''
  uploading.value = true
  const result = await uploadImage(file, 'roteiros')
  uploading.value = false

  if ('error' in result) {
    errorMessage.value = result.error
    return
  }

  draft.cover_image = result.url
}

const uploadGallery = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return

  errorMessage.value = ''
  uploading.value = true

  for (const file of files) {
    const result = await uploadImage(file, 'roteiros')
    if ('error' in result) {
      errorMessage.value = result.error
      break
    }
    draft.gallery.push({ label: file.name.replace(/\.[^.]+$/, ''), image: result.url })
  }

  uploading.value = false
}

const removeGalleryItem = (index: number) => draft.gallery.splice(index, 1)

const commonsTerm = ref('')
const commonsOpen = ref(false)
const commonsResultsEl = ref<HTMLElement | null>(null)

// Em tela estreita a grade nasce abaixo da dobra e passa despercebida.
const revealResults = async () => {
  await nextTick()
  commonsResultsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const runCommonsSearch = async () => {
  await searchCommons(commonsTerm.value)
  await revealResults()
}

const useSuggestion = async (term: string) => {
  commonsTerm.value = term
  await searchCommons(term)
  await revealResults()
}

const addFromCommons = (item: CommonsImage) => {
  if (draft.gallery.some((existing) => existing.image === item.image)) return

  draft.gallery.push({
    label: item.title,
    image: item.image,
    credit: item.credit,
    license: item.license,
    source: item.source
  })
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
        <NuxtLink to="/painel" @click="closeMenu">Visão geral</NuxtLink>
        <NuxtLink class="active" to="/painel/roteiros" @click="closeMenu">Meus roteiros</NuxtLink>
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
          <p class="eyebrow">Suas experiências</p>
          <h1>Meus roteiros</h1>
          <p>Cada roteiro é um ponto de partida. O visitante escolhe um, informa dias e grupo, e você recebe a solicitação.</p>
        </div>
        <ThemeToggle />
      </header>

      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

      <section class="request-section">
        <div class="section-heading">
          <div><p class="eyebrow">{{ editing ? 'Editando' : 'Novo' }}</p><h2>{{ editing ? draft.title || 'Roteiro' : 'Criar roteiro' }}</h2></div>
          <button v-if="editing" class="text-button" type="button" @click="resetDraft">← Cancelar edição</button>
        </div>

        <form class="route-form" @submit.prevent="saveRoute">
          <div class="profile-fields">
            <label class="form-field form-field-wide">Nome do roteiro<input v-model="draft.title" type="text" placeholder="Ex.: Um dia entre cataratas"></label>
            <label class="form-field">Categoria<input v-model="draft.category" type="text" placeholder="Turismo, Compras…"></label>
            <!-- step="10" com min="1" só aceitava 1, 11, 21… e barrava 320 sem
                 explicação visível. "any" tira essa classe de problema. -->
            <label class="form-field">Valor por dia (grupo)<input v-model.number="draft.price_per_day" type="number" min="1" step="any"></label>
            <label class="form-field">Máximo de pessoas<input v-model.number="draft.capacity" type="number" min="1" max="30"></label>
            <label class="form-field">Ativo<select v-model="draft.active"><option :value="true">Sim, visível no site</option><option :value="false">Não, rascunho</option></select></label>
            <label class="form-field form-field-wide">Descrição<textarea v-model="draft.description" rows="3" placeholder="O que a pessoa vai viver nesse roteiro."></textarea></label>
            <label class="form-field form-field-wide">Destaques (separe por vírgula)<input v-model="draft.highlightsText" type="text" placeholder="Itaipu, Marco das Três Fronteiras, Cataratas"></label>
          </div>

          <div class="route-media">
            <div class="route-cover">
              <p class="eyebrow">Foto de capa</p>
              <button class="cover-button" type="button" :disabled="uploading" @click="coverInput?.click()">
                <img v-if="draft.cover_image" :src="draft.cover_image" alt="">
                <span v-else>{{ uploading ? 'Enviando…' : 'Escolher imagem' }}</span>
              </button>
              <input ref="coverInput" class="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadCover">
              <button v-if="draft.cover_image" class="text-button" type="button" @click="draft.cover_image = ''">Remover capa</button>
            </div>

            <div class="route-gallery">
              <p class="eyebrow">Galeria</p>
              <div class="gallery-grid">
                <div v-for="(item, index) in draft.gallery" :key="item.image" class="gallery-item">
                  <img :src="item.image" :alt="item.label">
                  <span v-if="item.credit" class="gallery-credit" :title="`${item.credit} · ${item.license}`">©</span>
                  <button type="button" aria-label="Remover foto" @click="removeGalleryItem(index)">×</button>
                </div>
                <button class="gallery-add" type="button" :disabled="uploading" @click="galleryInput?.click()">{{ uploading ? '…' : '+' }}</button>
              </div>
              <input ref="galleryInput" class="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" multiple @change="uploadGallery">

              <button class="text-button" type="button" @click="commonsOpen = !commonsOpen">
                {{ commonsOpen ? '− Fechar busca de fotos' : '+ Buscar foto no Wikimedia Commons' }}
              </button>

              <div v-if="commonsOpen" class="commons-panel">
                <div class="commons-search">
                  <input v-model="commonsTerm" type="search" placeholder="Itaipu Dam, Iguazu Falls…" @keydown.enter.prevent="runCommonsSearch">
                  <button class="button button-outline button-small" type="button" :disabled="searching" @click="runCommonsSearch">{{ searching ? 'Buscando…' : 'Buscar' }}</button>
                </div>

                <p v-if="searchError" class="commons-error">{{ searchError }}</p>

                <!-- Resultados imediatamente abaixo do campo. As sugestões só
                     servem antes da primeira busca; depois elas empurrariam a
                     grade para fora da tela. -->
                <div v-if="commonsResults.length" ref="commonsResultsEl">
                  <p class="commons-count">{{ commonsResults.length }} foto(s) encontradas — clique para adicionar à galeria</p>

                  <div class="commons-results">
                    <button v-for="item in commonsResults" :key="item.image" type="button" class="commons-result" @click="addFromCommons(item)">
                      <img :src="item.thumb" :alt="item.title" loading="lazy">
                      <span>{{ item.license }}</span>
                    </button>
                  </div>

                  <p class="commons-hint">
                    As licenças do Commons exigem crédito ao autor. Ele é guardado junto com a foto e aparece na página pública.
                  </p>
                </div>

                <template v-else>
                  <p class="commons-hint">Busque pelo nome do ponto turístico, não da cidade — "Foz do Iguaçu" devolve posto de gasolina e ônibus urbano. Um hífen antes de um termo o exclui da busca.</p>

                  <div class="commons-suggestions">
                    <button v-for="term in COMMONS_SUGGESTIONS" :key="term" type="button" @click="useSuggestion(term)">{{ term }}</button>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- A mensagem também aparece aqui embaixo: o alerta do topo fica
               fora da tela quando o formulário está preenchido, e quem clica em
               salvar está olhando para o botão. -->
          <p v-if="errorMessage" class="admin-error form-error" role="alert">{{ errorMessage }}</p>

          <div class="profile-form-actions">
            <p>O valor é sempre por grupo, por dia. Os pacotes Essencial, Conforto e Completo multiplicam esse valor.</p>
            <button class="button button-lime" type="submit" :disabled="saving || uploading">{{ saving ? 'Salvando…' : (editing ? 'Salvar alterações' : 'Criar roteiro') }} <span aria-hidden="true">→</span></button>
          </div>
        </form>
      </section>

      <section class="request-section">
        <div class="section-heading">
          <div><p class="eyebrow">Cadastrados</p><h2>{{ routes.length }} roteiro(s)</h2></div>
        </div>

        <p v-if="loading" class="admin-loading">Carregando…</p>
        <p v-else-if="!routes.length" class="admin-loading">Nenhum roteiro ainda. Crie o primeiro no formulário acima — sem pelo menos um, sua página pública fica vazia.</p>

        <div v-else class="requests-table" role="table" aria-label="Meus roteiros">
          <div class="table-head table-head-routes" role="row"><span>Roteiro</span><span>Valor / dia</span><span>Grupo</span><span>Situação</span><span>Ações</span></div>
          <div v-for="route in routes" :key="route.id" class="table-row table-row-routes" role="row">
            <span><b>{{ route.title }}</b><small>{{ route.category || 'sem categoria' }}</small></span>
            <b>{{ money(route.price_per_day) }}</b>
            <span>até {{ route.capacity }}</span>
            <span class="status" :class="route.active ? 'confirmada' : 'nova'">{{ route.active ? 'ativo' : 'rascunho' }}</span>
            <span class="route-actions">
              <button class="text-button" type="button" @click="editRoute(route)">Editar</button>
              <button class="text-button" type="button" @click="toggleActive(route)">{{ route.active ? 'Desativar' : 'Ativar' }}</button>
              <button class="text-button danger" type="button" @click="removeRoute(route)">Excluir</button>
            </span>
          </div>
        </div>
      </section>
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

.route-form { display: grid; gap: 20px; }

.form-error { margin: 0; }

.route-media {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: start;
}

.cover-button {
  display: block;
  width: 100%;
  height: 150px;
  padding: 0;
  overflow: hidden;
  border: 1px dashed var(--line);
  border-radius: 12px;
  background: var(--paper-strong);
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
}

.cover-button img { width: 100%; height: 100%; object-fit: cover; }

.gallery-grid { display: flex; flex-wrap: wrap; gap: 10px; }

.gallery-item { position: relative; width: 84px; height: 84px; }
.gallery-item img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }

.gallery-item button {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: var(--coral);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.gallery-add {
  width: 84px;
  height: 84px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: none;
  color: var(--muted);
  font-size: 22px;
  cursor: pointer;
}

.gallery-credit {
  position: absolute;
  left: 4px;
  bottom: 4px;
  padding: 1px 5px;
  border-radius: 6px;
  background: #15221ecc;
  color: #edf1f2;
  font-size: 10px;
  cursor: help;
}

.hidden-input { display: none; }

.commons-panel {
  margin-top: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--paper);
}

.commons-search { display: flex; gap: 8px; }

.commons-search input {
  flex: 1;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel-solid);
  color: inherit;
  font: inherit;
  font-size: 13px;
}

.commons-hint { margin: 8px 0 0; color: var(--muted); font-size: 12px; line-height: 1.45; }

.commons-count {
  margin: 12px 0 0;
  color: var(--coral);
  font-size: 12px;
  font-weight: 700;
}

.commons-error { margin: 8px 0 0; color: var(--coral); font-size: 12px; }

.commons-suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

.commons-suggestions button {
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 99px;
  background: var(--panel-solid);
  color: var(--ink-soft);
  font-size: 11px;
  cursor: pointer;
}

.commons-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.commons-result {
  position: relative;
  padding: 0;
  height: 96px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: none;
  cursor: pointer;
}

.commons-result img { width: 100%; height: 100%; object-fit: cover; }

.commons-result span {
  position: absolute;
  inset: auto 0 0 0;
  padding: 3px 4px;
  background: #15221ecc;
  color: #edf1f2;
  font-size: 9px;
  text-align: center;
}

.route-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.text-button.danger { color: var(--coral); }

.table-head-routes,
.table-row-routes { grid-template-columns: 1.6fr 0.8fr 0.6fr 0.7fr 1.1fr; }

@media (max-width: 720px) {
  .route-media { grid-template-columns: 1fr; }
}
</style>
