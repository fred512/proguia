<script setup lang="ts">
const props = defineProps<{
  slug: string | null
  published: boolean
}>()

// origin só existe no navegador; a página é pré-renderizada.
const origin = ref('')
const copied = ref(false)

onMounted(() => { origin.value = window.location.origin })

const fullUrl = computed(() =>
  props.slug ? `${origin.value}/anfitriao/${props.slug}` : ''
)

const displayUrl = computed(() =>
  fullUrl.value.replace(/^https?:\/\//, '')
)

const copy = async () => {
  if (!fullUrl.value) return
  await navigator.clipboard.writeText(fullUrl.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 2500)
}
</script>

<template>
  <section v-if="slug" class="public-link" :class="{ 'is-draft': !published }">
    <div class="public-link-head">
      <p class="eyebrow">Sua página</p>
      <span class="public-link-state">{{ published ? 'No ar' : 'Ainda não publicada' }}</span>
    </div>

    <code class="public-link-url">{{ displayUrl || '…' }}</code>

    <div class="public-link-actions">
      <button class="button button-lime button-small" type="button" :disabled="!fullUrl" @click="copy">
        {{ copied ? 'Copiado' : 'Copiar link' }}
      </button>
      <a v-if="published && fullUrl" class="text-button" :href="fullUrl" target="_blank" rel="noopener">Abrir ↗</a>
    </div>

    <!-- Sem este aviso, a pessoa divulga um endereço que responde "Anfitrião
         não encontrado" para os clientes dela — pior que não ter link. -->
    <p v-if="!published" class="public-link-warning">
      Este endereço só funciona depois que seu perfil for publicado. Divulgar agora leva seus contatos a uma página vazia.
    </p>
    <p v-else class="public-link-hint">
      Cole na bio do Instagram, no status do WhatsApp ou mande direto para quem pedir.
    </p>
  </section>
</template>

<style scoped>
.public-link {
  display: grid;
  gap: 10px;
  padding: 18px 20px;
  margin-bottom: 22px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel-solid);
}

.public-link.is-draft { border-style: dashed; }

.public-link-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.public-link-head .eyebrow { margin: 0; }

.public-link-state {
  padding: 4px 9px;
  border-radius: 99px;
  background: var(--lime);
  color: #16201b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.is-draft .public-link-state { background: var(--paper-strong); color: var(--muted); }

.public-link-url {
  display: block;
  overflow-x: auto;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--paper);
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  white-space: nowrap;
}

.public-link-actions { display: flex; align-items: center; gap: 14px; }

.public-link-warning { margin: 0; color: var(--coral); font-size: 12px; line-height: 1.45; }
.public-link-hint { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
</style>
