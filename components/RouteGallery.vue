<script setup lang="ts">
import type { TravelRoute } from './RouteCard.vue'

defineProps<{ route: TravelRoute | null }>()
defineEmits<{
  close: []
  choose: [route: TravelRoute]
}>()
</script>

<template>
  <div v-if="route" class="dialog-backdrop" role="presentation" @click.self="$emit('close')">
    <section class="gallery-dialog" role="dialog" aria-modal="true" :aria-labelledby="`gallery-title-${route.id}`">
      <header class="dialog-header">
        <div>
          <p class="eyebrow">Galeria do roteiro</p>
          <h2 :id="`gallery-title-${route.id}`">{{ route.title }}</h2>
        </div>
        <button class="icon-button" type="button" aria-label="Fechar galeria" @click="$emit('close')">×</button>
      </header>
      <p class="dialog-intro">Referências de lugares que podem entrar na experiência — a composição final acompanha os dias e o perfil do seu grupo.</p>
      <div class="gallery-grid">
        <figure v-for="photo in route.gallery" :key="photo.label">
          <img :src="photo.image" :alt="photo.label">
          <figcaption>{{ photo.label }}</figcaption>
        </figure>
      </div>
      <footer class="dialog-actions">
        <button class="button button-lime" type="button" @click="$emit('choose', route)">Montar este roteiro <span aria-hidden="true">→</span></button>
      </footer>
    </section>
  </div>
</template>
