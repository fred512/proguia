<script setup lang="ts">
const route = useRoute()
const { user, isAdmin, hasGuideProfile, inviteError, init, rememberInvite, pendingInvite, redeemPendingInvite, signInWithEmail, signInWithGoogle } = useAuth()

// Distingue "nenhum token chegou" de "o banco recusou o token" — sem isso os
// dois casos produzem a mesma tela e não dá para saber onde olhar.
const tokenFound = ref(false)

const email = ref('')
const sending = ref(false)
const sent = ref(false)
const redirecting = ref(false)
const errorMessage = ref('')
const noInvite = ref(false)

const inviteToken = computed(() => String(route.query.convite ?? ''))

onMounted(async () => {
  // Guardado antes do login porque o fluxo do Google sai da página e volta
  // sem os parâmetros da URL original.
  if (inviteToken.value) rememberInvite(inviteToken.value)
  noInvite.value = route.query['sem-convite'] === '1'

  await init()

  if (user.value && (hasGuideProfile.value || isAdmin.value)) {
    await navigateTo('/painel')
    return
  }

  // O retorno do OAuth pode cair aqui em vez de /painel, dependendo de como o
  // Supabase resolve o redirect. Então esta tela também tenta resgatar, em vez
  // de depender só do middleware.
  if (user.value) {
    tokenFound.value = Boolean(inviteToken.value || pendingInvite())
    if (tokenFound.value) {
      await redeemPendingInvite(inviteToken.value)
      if (hasGuideProfile.value) await navigateTo('/painel')
    }
  }
})

const submitEmail = async () => {
  errorMessage.value = ''
  sending.value = true
  const { error } = await signInWithEmail(email.value)
  sending.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }
  sent.value = true
}

// signInWithOAuth troca a página inteira, então em caso de sucesso nada abaixo
// dele roda. Só voltamos a habilitar o botão se der erro.
const submitGoogle = async () => {
  errorMessage.value = ''
  redirecting.value = true
  const { error } = await signInWithGoogle()
  if (error) {
    errorMessage.value = error.message
    redirecting.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <BrandLogo />

      <div class="login-heading">
        <p class="eyebrow">Painel do anfitrião</p>
        <h1>Entrar</h1>
        <p>Acesso restrito a anfitriões convidados. Clientes não precisam de conta para solicitar um roteiro.</p>
      </div>

      <p v-if="inviteError" class="login-error" role="alert">
        O convite não pôde ser usado: {{ inviteError }}
      </p>

      <p v-if="inviteToken" class="login-invite" role="status">
        Convite reconhecido. Entre com seu e-mail ou com o Google para ativar seu perfil de guia.
      </p>

      <p v-if="noInvite && !inviteError" class="login-error" role="alert">
        <template v-if="tokenFound">
          O convite foi encontrado mas não pôde ser aplicado. Abra o link novamente nesta mesma janela.
        </template>
        <template v-else>
          Sua conta foi criada, mas <strong>nenhum convite chegou junto com ela</strong>. Abra o link que você recebeu — ele precisa ser aberto no mesmo navegador em que você faz o login. Se não tiver o link, peça outro a quem administra a plataforma.
        </template>
      </p>

      <div v-if="sent" class="login-sent" role="status">
        <div class="login-symbol">✓</div>
        <h2>Link enviado</h2>
        <p>Abra o e-mail que acabou de chegar em <strong>{{ email }}</strong> e clique no link para entrar. Ele vale por poucos minutos.</p>
        <button class="text-button" type="button" @click="sent = false">← Usar outro e-mail</button>
      </div>

      <template v-else>
        <form class="login-form" @submit.prevent="submitEmail">
          <label class="form-field">
            E-mail
            <input v-model="email" type="email" required autocomplete="email" placeholder="voce@email.com">
          </label>
          <button class="button button-lime full-button" type="submit" :disabled="sending || !email">
            {{ sending ? 'Enviando…' : 'Receber link de acesso' }}
            <span v-if="!sending" aria-hidden="true">→</span>
          </button>
        </form>

        <div class="login-divider"><span>ou</span></div>

        <button class="button button-quiet full-button" type="button" :disabled="redirecting" @click="submitGoogle">
          {{ redirecting ? 'Redirecionando…' : 'Entrar com Google' }}
        </button>
      </template>

      <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>

      <NuxtLink class="login-back" to="/">← Voltar ao site</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 34px 30px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--panel-solid);
  box-shadow: var(--shadow);
}

.login-heading h1 {
  margin: 4px 0 8px;
  font-size: 30px;
}

.login-heading p:last-child {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.login-sent {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-symbol {
  align-self: center;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--lime);
  color: #16201b;
  font-size: 22px;
  font-weight: 700;
}

.login-sent h2 { margin: 0; font-size: 22px; }
.login-sent p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.5; }

.login-invite {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #d9f55a24;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.5;
}

.login-error {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #ed725420;
  color: var(--coral);
  font-size: 13px;
}

.login-back {
  align-self: center;
  color: var(--muted);
  font-size: 13px;
  text-decoration: none;
}

.login-back:hover { color: var(--ink); }
</style>
