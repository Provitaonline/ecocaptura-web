import { resolve } from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: [
    'buefy/dist/css/buefy.css',
    '@mdi/font/css/materialdesignicons.min.css',
    '~/assets/css/main.css'
  ],
  srcDir: 'app/',

  plugins: [
    { src: '~/plugins/buefy.ts', mode: 'client' }
  ],
  
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'buefy',
        'cesium'
      ]
    }
  },
  devtools: { enabled: true },
  ssr: false,
  runtimeConfig: {
    public: {
      cesiumIonToken: process.env.NUXT_CESIUM_ION_TOKEN,
      googleClientId: '1094233920540-0p9k7abpr4769drbm70f0f33os3caa9c.apps.googleusercontent.com',
      apiBase: 'https://fgq9vq9c6j.execute-api.us-east-2.amazonaws.com/Prod'
    },
  },
  app: {
    head: {
      script: [
        {
          src: 'https://accounts.google.com/gsi/client',
          async: true,
          defer: true
        }
      ]
    }
  },
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
      { code: 'es', iso: 'es-VE', name: 'Español', file: 'es.json' }
    ],
    lazy: true,
    defaultLocale: 'es',
    strategy: 'prefix_except_default'
  } as any,
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/icon'
  ] 
})
