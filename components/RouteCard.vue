<script setup lang="ts">
// Espelha as colunas de `public.routes`. credit/license/source só existem em
// foto vinda do Wikimedia Commons, cujas licenças obrigam atribuição.
export type GalleryPhoto = {
  label: string
  image: string
  credit?: string
  license?: string
  source?: string
}

export type TravelRoute = {
  id: string
  title: string
  category: string
  description: string
  price_per_day: number
  capacity: number
  cover_image: string | null
  highlights: string[]
  gallery: GalleryPhoto[]
}

defineProps<{ route: TravelRoute }>()
defineEmits<{
  gallery: [route: TravelRoute]
  choose: [route: TravelRoute]
}>()

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))
</script>

<template>
  <article class="route-card">
    <button class="route-photo" type="button" :aria-label="`Ver galeria de ${route.title}`" @click="$emit('gallery', route)">
      <img v-if="route.cover_image" :src="route.cover_image" :alt="`Foto de ${route.title}`">
      <span v-else class="route-photo-empty" aria-hidden="true">✦</span>
      <span v-if="route.category" class="route-category">{{ route.category }}</span>
      <span v-if="route.gallery.length" class="gallery-tip">Ver fotos <span aria-hidden="true">↗</span></span>
    </button>
    <div class="route-card-body">
      <div class="route-card-head">
        <h3>{{ route.title }}</h3>
        <span>até {{ route.capacity }} pessoas</span>
      </div>
      <p>{{ route.description }}</p>
      <ul v-if="route.highlights.length" class="route-highlights" aria-label="Possibilidades deste roteiro">
        <li v-for="item in route.highlights" :key="item">{{ item }}</li>
      </ul>
      <div class="route-card-foot">
        <div class="route-price">
          <strong>{{ money(route.price_per_day) }}</strong>
          <span>por dia · grupo</span>
        </div>
        <button class="button button-lime button-small" type="button" @click="$emit('choose', route)">
          Escolher <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.route-photo-empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--paper-strong);
  color: var(--muted);
  font-size: 32px;
}
</style>
