<script setup lang="ts">
export type TravelRoute = {
  id: string
  title: string
  category: string
  price: number
  capacity: number
  description: string
  image: string
  highlights: string[]
  gallery: Array<{ label: string, image: string }>
}

defineProps<{ route: TravelRoute }>()
defineEmits<{
  gallery: [route: TravelRoute]
  choose: [route: TravelRoute]
}>()

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
</script>

<template>
  <article class="route-card">
    <button class="route-photo" type="button" :aria-label="`Ver galeria de ${route.title}`" @click="$emit('gallery', route)">
      <img :src="route.image" :alt="`Foto de ${route.title}`">
      <span class="route-category">{{ route.category }}</span>
      <span class="gallery-tip">Ver fotos <span aria-hidden="true">↗</span></span>
    </button>
    <div class="route-card-body">
      <div class="route-card-head">
        <h3>{{ route.title }}</h3>
        <span>até {{ route.capacity }} pessoas</span>
      </div>
      <p>{{ route.description }}</p>
      <ul class="route-highlights" aria-label="Possibilidades deste roteiro">
        <li v-for="item in route.highlights" :key="item">{{ item }}</li>
      </ul>
      <div class="route-card-foot">
        <div class="route-price">
          <strong>{{ money(route.price) }}</strong>
          <span>por dia · grupo</span>
        </div>
        <button class="button button-lime button-small" type="button" @click="$emit('choose', route)">
          Escolher <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </article>
</template>
