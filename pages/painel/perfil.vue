<script setup lang="ts">
const profile = reactive({
  name: 'Marcia Marianno Machado',
  email: '',
  phone: '',
  languages: 'Português e Español',
  region: 'Tríplice Fronteira · Paraguai',
  groupLimit: 6,
  bio: 'Guia local especializada na Tríplice Fronteira. Cada experiência é desenhada com atenção ao ritmo, aos interesses e ao tamanho de cada grupo.'
})

const saved = ref(false)
const menuOpen = ref(false)

const saveProfile = () => {
  saved.value = true
  window.setTimeout(() => { saved.value = false }, 3500)
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
        <NuxtLink to="/painel#solicitacoes" @click="closeMenu">Solicitações</NuxtLink>
        <NuxtLink class="active" to="/painel/perfil" @click="closeMenu">Dados da guia</NuxtLink>
        <NuxtLink to="/" @click="closeMenu">Ver site público</NuxtLink>
      </nav>
      <p>Ambiente inicial de Marcia Marianno Machado.</p>
    </aside>

    <section class="admin-content profile-admin-content">
      <header class="admin-title-row">
        <div>
          <p class="eyebrow">Perfil público</p>
          <h1>Dados da guia</h1>
          <p>Estas informações vão compor a apresentação da guia e serão a base para os futuros recursos de contato.</p>
        </div>
        <ThemeToggle />
      </header>

      <form class="profile-editor" @submit.prevent="saveProfile">
        <aside class="profile-summary">
          <div class="profile-photo"><img src="/images/marcia-marianno-machado.jpg" alt="Marcia Marianno Machado"></div>
          <span class="profile-state">Perfil em preparação</span>
          <h2>{{ profile.name }}</h2>
          <p>{{ profile.region }}</p>
          <div class="profile-summary-tags"><span>{{ profile.languages }}</span><span>até {{ profile.groupLimit }} pessoas</span></div>
        </aside>

        <section class="profile-form-card">
          <div class="profile-form-heading"><div><p class="eyebrow">Informações principais</p><h2>Conte sobre você</h2></div><span>Campos editáveis</span></div>

          <div class="profile-fields">
            <label class="form-field form-field-wide">Nome da guia<input v-model="profile.name" type="text" autocomplete="name"></label>
            <label class="form-field">E-mail para contato<input v-model="profile.email" type="email" placeholder="seuemail@exemplo.com" autocomplete="email"></label>
            <label class="form-field">Celular / WhatsApp<input v-model="profile.phone" type="tel" placeholder="(00) 00000-0000" autocomplete="tel"></label>
            <label class="form-field">Idiomas de atendimento<input v-model="profile.languages" type="text"></label>
            <label class="form-field">Limite por grupo<input v-model.number="profile.groupLimit" type="number" min="1" max="30"></label>
            <label class="form-field form-field-wide">Região atendida<input v-model="profile.region" type="text"></label>
            <label class="form-field form-field-wide">Apresentação<textarea v-model="profile.bio" rows="5" maxlength="420"></textarea><small>{{ profile.bio.length }}/420 caracteres</small></label>
          </div>

          <div class="profile-form-actions"><p>Os dados de contato serão usados quando a comunicação de solicitações for definida.</p><button class="button button-lime" type="submit">Salvar dados <span aria-hidden="true">→</span></button></div>
          <p v-if="saved" class="profile-saved" role="status">Dados atualizados nesta sessão.</p>
        </section>
      </form>
    </section>
  </main>
</template>
