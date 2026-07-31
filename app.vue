<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { isDark } = useTheme()
</script>

<template>
  <div class="app-shell" :class="{ 'theme-dark': isDark }">
    <VitePwaManifest />
    <NuxtLoadingIndicator color="#d9f55a" />
    <NuxtPage />
    <ClientOnly>
      <PwaInstallPrompt />
    </ClientOnly>
  </div>
</template>
