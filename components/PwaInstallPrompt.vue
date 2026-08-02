<script setup lang="ts">
const { $pwa } = useNuxtApp()
const dismissed = ref(false)

const installApp = async () => {
  await $pwa?.install()
}

const refreshApp = async () => {
  await $pwa?.updateServiceWorker()
}

const dismissInstall = async () => {
  dismissed.value = true
  await $pwa?.cancelInstall()
}
</script>

<template>
  <aside v-if="$pwa && !dismissed && ($pwa.showInstallPrompt || $pwa.needRefresh || $pwa.offlineReady)" class="pwa-prompt" aria-live="polite">
    <div class="pwa-prompt-icon">✦</div>
    <div>
      <strong v-if="$pwa.needRefresh">Uma nova versão está pronta.</strong>
      <strong v-else-if="$pwa.offlineReady">PersonalTravel pronto para usar offline.</strong>
      <strong v-else>Leve o PersonalTravel no seu celular.</strong>
      <p v-if="$pwa.needRefresh">Atualize para receber a versão mais recente.</p>
      <p v-else-if="$pwa.offlineReady">A interface principal agora funciona sem internet.</p>
      <p v-else>Instale o app para acesso rápido durante a viagem.</p>
    </div>
    <div class="pwa-prompt-actions">
      <button v-if="$pwa.needRefresh" class="pwa-action" type="button" @click="refreshApp">Atualizar</button>
      <button v-else-if="$pwa.showInstallPrompt" class="pwa-action" type="button" @click="installApp">Instalar</button>
      <button class="pwa-dismiss" type="button" aria-label="Fechar aviso" @click="dismissInstall">×</button>
    </div>
  </aside>
</template>
