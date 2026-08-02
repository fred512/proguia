<script setup lang="ts">
useHead({ title: 'Seja um anfitrião — PersonalTravel' })

const supabase = useSupabase()

const form = reactive({ name: '', email: '', phone: '', region: '', message: '' })
const sending = ref(false)
const sent = ref(false)
const alreadyPending = ref(false)
const errorMessage = ref('')
const mobileMenuOpen = ref(false)

const submit = async () => {
  errorMessage.value = ''
  sending.value = true

  const { data, error } = await supabase.rpc('create_host_application', {
    p_name: form.name,
    p_email: form.email,
    p_phone: form.phone || null,
    p_region: form.region || null,
    p_message: form.message || null
  })

  sending.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  alreadyPending.value = data?.status === 'already_pending'
  sent.value = true
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

    <section class="page-width apply-page">
      <div class="apply-copy">
        <p class="eyebrow">Para quem recebe</p>
        <h1>Seja um anfitrião.</h1>
        <p>O cadastro no PersonalTravel é por convite. Você se candidata aqui, a gente conversa, e só então seu perfil entra no ar. É assim que a curadoria se mantém — e é o que faz o viajante confiar em quem vai encontrar.</p>
        <ol class="apply-steps">
          <li><span>01</span> Você conta quem é e onde recebe</li>
          <li><span>02</span> A gente conversa para entender seu trabalho</li>
          <li><span>03</span> Você recebe um link de convite e monta seu perfil</li>
        </ol>
      </div>

      <div class="apply-card">
        <div v-if="sent" class="apply-done" role="status">
          <div class="confirmation-symbol">✓</div>
          <h2>{{ alreadyPending ? 'Sua candidatura já está na fila' : 'Candidatura enviada' }}</h2>
          <p v-if="alreadyPending">Já existe uma candidatura em aberto para <strong>{{ form.email }}</strong>. Não precisa enviar de novo — entraremos em contato.</p>
          <p v-else>Recebemos seus dados. Se fizer sentido, entramos em contato por <strong>{{ form.email }}</strong> com o link de convite.</p>
          <NuxtLink class="button button-quiet" to="/">Voltar ao início</NuxtLink>
        </div>

        <form v-else class="apply-form" @submit.prevent="submit">
          <label class="form-field">Seu nome<input v-model="form.name" type="text" required autocomplete="name" placeholder="Nome completo"></label>
          <div class="field-row">
            <label class="form-field">E-mail<input v-model="form.email" type="email" required autocomplete="email" placeholder="voce@email.com"></label>
            <label class="form-field">Telefone / WhatsApp<input v-model="form.phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></label>
          </div>
          <label class="form-field">Onde você recebe<input v-model="form.region" type="text" placeholder="Foz do Iguaçu, Ciudad del Este…"></label>
          <label class="form-field">Conte um pouco<textarea v-model="form.message" rows="5" maxlength="600" placeholder="Há quanto tempo você recebe visitantes, que tipo de experiência você oferece."></textarea><small>{{ form.message.length }}/600</small></label>

          <p v-if="errorMessage" class="form-alert">{{ errorMessage }}</p>

          <button class="button button-lime full-button" type="submit" :disabled="sending || !form.name || !form.email">
            {{ sending ? 'Enviando…' : 'Enviar candidatura' }} <span v-if="!sending" aria-hidden="true">→</span>
          </button>
          <p class="apply-note">Seus dados ficam com a operação do PersonalTravel e não aparecem no site.</p>
        </form>
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
.apply-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
  padding: 130px 0 60px;
}

.apply-copy h1 {
  margin: 6px 0 14px;
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 46px;
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.apply-copy > p { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.6; }

.apply-steps { display: grid; gap: 12px; margin: 26px 0 0; padding: 0; list-style: none; }

.apply-steps li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: var(--ink-soft);
  font-size: 14px;
}

.apply-steps span {
  color: var(--coral);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 500;
}

.apply-card {
  padding: 28px 26px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-solid);
}

.apply-form { display: grid; gap: 16px; }

.apply-note { margin: 0; color: var(--muted); font-size: 12px; }

.apply-done { display: grid; gap: 12px; justify-items: center; text-align: center; }

.apply-done h2 {
  margin: 0;
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 26px;
}

.apply-done p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.55; }

@media (max-width: 860px) {
  .apply-page { grid-template-columns: 1fr; padding-top: 110px; }
  .apply-copy h1 { font-size: 38px; }
}
</style>
