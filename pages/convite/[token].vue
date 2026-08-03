<script setup lang="ts">
useHead({ title: 'Convite — PersonalTravel' })

const route = useRoute()
const { user, isAdmin, hasGuideProfile, init, loadRoles } = useAuth()
const supabase = useSupabase()

// O token vem no caminho, não em query string. Tentativas anteriores guardavam
// em localStorage, cookie e `?convite=`, e os três chegavam vazios depois do
// desvio pelo Google. Caminho de URL sobrevive ao redirecionamento; foi o
// único canal que ainda não havia falhado.
const token = computed(() => String(route.params.token ?? ''))

const status = ref<'checking' | 'anonymous' | 'redeeming' | 'failed'>('checking')
const errorMessage = ref('')
const email = ref('')
const sending = ref(false)
const sent = ref(false)

// O retorno do provedor volta para esta mesma página, então o token continua
// disponível sem depender de nada guardado no navegador.
const selfUrl = () => `${window.location.origin}/convite/${token.value}`

const redeem = async () => {
  status.value = 'redeeming'

  const { error } = await supabase.rpc('redeem_guide_invite', { p_token: token.value })

  if (error) {
    errorMessage.value = error.message
    status.value = 'failed'
    return
  }

  await loadRoles()
  await navigateTo('/painel')
}

onMounted(async () => {
  if (!token.value) {
    errorMessage.value = 'Link de convite incompleto.'
    status.value = 'failed'
    return
  }

  await init()

  if (!user.value) {
    status.value = 'anonymous'
    return
  }

  if (hasGuideProfile.value || isAdmin.value) {
    await navigateTo('/painel')
    return
  }

  await redeem()
})

const signInWithEmail = async () => {
  errorMessage.value = ''
  sending.value = true

  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim().toLowerCase(),
    options: { emailRedirectTo: selfUrl() }
  })

  sending.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }
  sent.value = true
}

const signInWithGoogle = async () => {
  errorMessage.value = ''

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: selfUrl() }
  })

  if (error) errorMessage.value = error.message
}
</script>

<template>
  <main class="invite-page">
    <section class="invite-card">
      <BrandLogo />

      <div class="invite-heading">
        <p class="eyebrow">Convite</p>
        <h1>Seja anfitrião</h1>
      </div>

      <p v-if="status === 'checking'" class="invite-status">Verificando o convite…</p>
      <p v-else-if="status === 'redeeming'" class="invite-status">Ativando seu perfil…</p>

      <div v-else-if="status === 'failed'" class="invite-failed" role="alert">
        <p class="invite-error">{{ errorMessage }}</p>
        <p class="invite-status">Peça um link novo a quem administra a plataforma.</p>
        <NuxtLink class="text-button" to="/">← Voltar ao site</NuxtLink>
      </div>

      <template v-else>
        <div v-if="sent" class="invite-sent" role="status">
          <div class="confirmation-symbol">✓</div>
          <h2>Link enviado</h2>
          <p class="invite-status">Abra o e-mail que chegou em <strong>{{ email }}</strong> e clique no link. Seu perfil de anfitrião é ativado ao entrar.</p>
        </div>

        <template v-else>
          <p class="invite-status">Entre para ativar seu perfil. O convite é aplicado automaticamente.</p>

          <form class="invite-form" @submit.prevent="signInWithEmail">
            <label class="form-field">
              E-mail
              <input v-model="email" type="email" required autocomplete="email" placeholder="voce@email.com">
            </label>
            <button class="button button-lime full-button" type="submit" :disabled="sending || !email">
              {{ sending ? 'Enviando…' : 'Receber link de acesso' }}
            </button>
          </form>

          <div class="invite-divider"><span>ou</span></div>

          <button class="button button-quiet full-button" type="button" @click="signInWithGoogle">
            Entrar com Google
          </button>

          <p v-if="errorMessage" class="invite-error" role="alert">{{ errorMessage }}</p>
        </template>
      </template>
    </section>
  </main>
</template>

<style scoped>
.invite-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
}

.invite-card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 34px 30px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--panel-solid);
  box-shadow: var(--shadow);
}

.invite-heading h1 {
  margin: 4px 0 0;
  font-size: 30px;
}

.invite-status { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.5; }

.invite-form { display: flex; flex-direction: column; gap: 16px; }

.invite-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.invite-divider::before,
.invite-divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }

.invite-failed, .invite-sent { display: grid; gap: 10px; }
.invite-sent { justify-items: center; text-align: center; }
.invite-sent h2 { margin: 0; font-size: 22px; }

.invite-error {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #ed725420;
  color: var(--coral);
  font-size: 13px;
}
</style>
