export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@vite-pwa/nuxt'],
  nitro: {
    prerender: {
      routes: [
        '/',
        '/anfitrioes',
        '/quero-ser-anfitriao',
        '/painel',
        '/painel/perfil',
        '/painel/entrar',
        '/painel/admin',
        '/painel/roteiros'
      ]
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabasePublishableKey: ''
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['images/favicon.ico', 'images/apple-touch-icon-180x180.png', 'images/proguia-logo.svg'],
    manifest: {
      name: 'PersonalTravel — Paraguai do seu jeito',
      short_name: 'PersonalTravel',
      description: 'Experiências privadas na Tríplice Fronteira, planejadas para o seu grupo.',
      theme_color: '#15221e',
      background_color: '#15221e',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      lang: 'pt-BR',
      categories: ['travel', 'lifestyle'],
      icons: [
        { src: '/images/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/images/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/images/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,json,webmanifest}'],
      // 200.html e 404.html são cascas que a Vercel serve por reescrita, não
      // rotas. O Workbox tentava pré-cachear /200 e /404 e recebia 404,
      // abortando a instalação do service worker.
      globIgnores: ['**/404.html', '**/200.html'],
      navigateFallback: '/',
      // O painel depende de sessão e de dados do banco: servir a home do cache
      // no lugar dele fazia o Nuxt hidratar na rota errada. Foi o que engolia
      // o `?convite=` do link de convite antes do onMounted guardá-lo.
      navigateFallbackDenylist: [/^\/painel/, /^\/convite/],
      // Sem isto, `/anfitriao/x?algo=1` não casa com `/anfitriao/x` no
      // precache e cai no fallback.
      ignoreURLParametersMatching: [/.*/],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/.*$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'proguia-route-images',
            expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'PersonalTravel — Paraguai do seu jeito',
      meta: [
        { name: 'description', content: 'Experiências privadas na Tríplice Fronteira, planejadas para o seu grupo.' },
        { name: 'theme-color', content: '#15221e' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/images/proguia-logo.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/apple-touch-icon-180x180.png' }
      ]
    }
  }
})
