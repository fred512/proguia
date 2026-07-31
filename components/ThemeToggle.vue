<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button class="theme-toggle" type="button" :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggleTheme">
    <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
    <span class="theme-toggle-label">{{ isDark ? 'Claro' : 'Escuro' }}</span>
  </button>
</template>
