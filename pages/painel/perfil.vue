<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, isAdmin, signOut } = useAuth()
const supabase = useSupabase()

const profile = reactive({
  name: '',
  email: '',
  phone: '',
  languages: '',
  region: '',
  groupLimit: 6,
  bio: '',
  photoUrl: ''
})

const published = ref(false)
const slug = ref<string | null>(null)
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const errorMessage = ref('')
const menuOpen = ref(false)

const initials = computed(() =>
  profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
)

const loadProfile = async () => {
  if (!user.value) return

  const { data, error } = await supabase
    .from('guides')
    .select('name, email, phone, languages, region, group_limit, bio, photo_url, published, slug')
    .eq('id', user.value.id)
    .single()

  loading.value = false

  if (error) {
    errorMessage.value = `Não foi possível carregar seu perfil: ${error.message}`
    return
  }

  profile.name = data.name ?? ''
  profile.email = data.email ?? ''
  profile.phone = data.phone ?? ''
  profile.languages = data.languages ?? ''
  profile.region = data.region ?? ''
  profile.groupLimit = data.group_limit ?? 6
  profile.bio = data.bio ?? ''
  profile.photoUrl = data.photo_url ?? ''
  published.value = data.published ?? false
  slug.value = data.slug ?? null
}

onMounted(loadProfile)

const saveProfile = async () => {
  if (!user.value) return

  errorMessage.value = ''
  saving.value = true

  // `published` não entra aqui de propósito: o banco não concede essa coluna
  // ao cliente, e enviá-la faria o update inteiro falhar.
  const { error } = await supabase
    .from('guides')
    .update({
      name: profile.name.trim(),
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone.trim(),
      languages: profile.languages.trim(),
      region: profile.region.trim(),
      group_limit: profile.groupLimit,
      bio: profile.bio.trim(),
      photo_url: profile.photoUrl.trim() || null
    })
    .eq('id', user.value.id)

  saving.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  saved.value = true
  window.setTimeout(() => { saved.value = false }, 3500)
}

const closeMenu = () => { menuOpen.value = false }

const photoInput = ref<HTMLInputElement | null>(null)
const uploadingPhoto = ref(false)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const pickPhoto = () => photoInput.value?.click()

const uploadPhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !user.value) return

  errorMessage.value = ''

  // O bucket também rejeita tipo e tamanho fora do permitido; isto só evita
  // uma ida ao servidor para dar erro.
  if (!ACCEPTED_TYPES.includes(file.type)) {
    errorMessage.value = 'Use uma imagem JPG, PNG ou WebP.'
    input.value = ''
    return
  }
  if (file.size > 3 * 1024 * 1024) {
    errorMessage.value = 'A imagem precisa ter até 3 MB.'
    input.value = ''
    return
  }

  uploadingPhoto.value = true

  // Nome com timestamp: a URL pública é cacheada por CDN, e reaproveitar o
  // mesmo caminho faria a foto antiga continuar aparecendo.
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.value.id}/perfil-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('guide-photos')
    .upload(path, file, { cacheControl: '3600', contentType: file.type })

  if (uploadError) {
    uploadingPhoto.value = false
    errorMessage.value = `Falha no envio: ${uploadError.message}`
    input.value = ''
    return
  }

  const { data } = supabase.storage.from('guide-photos').getPublicUrl(path)

  const { error: saveError } = await supabase
    .from('guides')
    .update({ photo_url: data.publicUrl })
    .eq('id', user.value.id)

  uploadingPhoto.value = false
  input.value = ''

  if (saveError) {
    errorMessage.value = saveError.message
    return
  }

  profile.photoUrl = data.publicUrl
}

const removePhoto = async () => {
  if (!user.value) return

  errorMessage.value = ''
  uploadingPhoto.value = true

  const { error } = await supabase
    .from('guides')
    .update({ photo_url: null })
    .eq('id', user.value.id)

  uploadingPhoto.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  profile.photoUrl = ''
}
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
        <NuxtLink to="/painel/roteiros" @click="closeMenu">Meus roteiros</NuxtLink>
        <NuxtLink class="active" to="/painel/perfil" @click="closeMenu">Meus dados</NuxtLink>
        <NuxtLink v-if="isAdmin" to="/painel/admin" @click="closeMenu">Administração</NuxtLink>
        <NuxtLink to="/" @click="closeMenu">Ver site público</NuxtLink>
        <button type="button" @click="signOut">Sair</button>
      </nav>
      <p>{{ profile.name || 'Perfil ainda sem nome' }}</p>
    </aside>

    <section class="admin-content profile-admin-content">
      <header class="admin-title-row">
        <div>
          <p class="eyebrow">Perfil público</p>
          <h1>Meus dados</h1>
          <p>Estas informações compõem sua apresentação no site e são a base para receber solicitações.</p>
        </div>
        <ThemeToggle />
      </header>

      <p v-if="loading" class="profile-loading">Carregando seu perfil…</p>

      <PublicLinkCard v-if="!loading" :slug="slug" :published="published" />

      <form v-if="!loading" class="profile-editor" @submit.prevent="saveProfile">
        <aside class="profile-summary">
          <button class="profile-photo photo-button" type="button" :disabled="uploadingPhoto" :aria-label="profile.photoUrl ? 'Trocar foto de perfil' : 'Enviar foto de perfil'" @click="pickPhoto">
            <img v-if="profile.photoUrl" :src="profile.photoUrl" :alt="profile.name">
            <span v-else class="profile-initials" aria-hidden="true">{{ initials || '—' }}</span>
            <span class="photo-overlay">{{ uploadingPhoto ? 'Enviando…' : (profile.photoUrl ? 'Trocar foto' : 'Enviar foto') }}</span>
          </button>
          <input ref="photoInput" class="photo-input" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadPhoto">
          <button v-if="profile.photoUrl && !uploadingPhoto" class="text-button photo-remove" type="button" @click="removePhoto">Remover foto</button>
          <span class="profile-state">{{ published ? 'Perfil publicado' : 'Perfil em preparação' }}</span>
          <h2>{{ profile.name || 'Seu nome' }}</h2>
          <p>{{ profile.region || 'Região ainda não informada' }}</p>
          <div class="profile-summary-tags">
            <span>{{ profile.languages || 'Idiomas a definir' }}</span>
            <span>até {{ profile.groupLimit }} pessoas</span>
          </div>
        </aside>

        <section class="profile-form-card">
          <div class="profile-form-heading"><div><p class="eyebrow">Informações principais</p><h2>Conte sobre você</h2></div><span>Campos editáveis</span></div>

          <div class="profile-fields">
            <label class="form-field form-field-wide">Seu nome<input v-model="profile.name" type="text" autocomplete="name" placeholder="Como você quer aparecer no site"></label>
            <label class="form-field">E-mail para contato<input v-model="profile.email" type="email" placeholder="seuemail@exemplo.com" autocomplete="email"></label>
            <label class="form-field">Celular / WhatsApp<input v-model="profile.phone" type="tel" placeholder="(00) 00000-0000" autocomplete="tel"></label>
            <label class="form-field">Idiomas de atendimento<input v-model="profile.languages" type="text" placeholder="Português, Español…"></label>
            <label class="form-field">Limite por grupo<input v-model.number="profile.groupLimit" type="number" min="1" max="30"></label>
            <label class="form-field form-field-wide">Região atendida<input v-model="profile.region" type="text" placeholder="Onde você guia"></label>
            <label class="form-field form-field-wide">Apresentação<textarea v-model="profile.bio" rows="5" maxlength="420" placeholder="Fale sobre seu jeito de guiar."></textarea><small>{{ profile.bio.length }}/420 caracteres</small></label>
          </div>

          <div class="profile-form-actions">
            <p v-if="published">Seu perfil está publicado e visível no site.</p>
            <p v-else>Seu perfil ainda não aparece no site. A publicação é liberada pela operação do PersonalTravel.</p>
            <button class="button button-lime" type="submit" :disabled="saving">{{ saving ? 'Salvando…' : 'Salvar dados' }} <span v-if="!saving" aria-hidden="true">→</span></button>
          </div>

          <p v-if="saved" class="profile-saved" role="status">Dados salvos.</p>
          <p v-if="errorMessage" class="profile-error" role="alert">{{ errorMessage }}</p>
        </section>
      </form>
    </section>
  </main>
</template>

<style scoped>
.profile-loading {
  color: var(--muted);
  font-size: 14px;
}

.profile-initials {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--paper-strong);
  color: var(--muted);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

/* .profile-photo define height mas não width: como <div> esticava sozinho na
   coluna, como <button> encolheria para o conteúdo. */
.photo-button {
  display: block;
  width: 100%;
  position: relative;
  padding: 0;
  border: 1px solid var(--line);
  background: none;
  cursor: pointer;
  overflow: hidden;
}

.photo-button:disabled { cursor: progress; }

.photo-overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: 7px 4px;
  background: #15221ecc;
  color: #edf1f2;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.photo-button:hover .photo-overlay,
.photo-button:focus-visible .photo-overlay,
.photo-button:disabled .photo-overlay { opacity: 1; }

/* Sempre visível no toque, onde não existe hover. */
@media (hover: none) {
  .photo-overlay { opacity: 1; }
}

/* display:none tira o input do fluxo — em telas pequenas .profile-summary vira
   grid e um input escondido por clip ainda ocuparia célula. O .click()
   programático funciona mesmo assim. */
.photo-input { display: none; }

.photo-remove {
  grid-column: 1 / -1;
  margin-top: 10px;
}

.profile-error {
  margin: 12px 0 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #ed725420;
  color: var(--coral);
  font-size: 13px;
}
</style>
