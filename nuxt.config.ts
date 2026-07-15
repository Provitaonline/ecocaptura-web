export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
    css: [
      'buefy/dist/css/buefy.css',
        '@mdi/font/css/materialdesignicons.min.css'
    ],
  srcDir: 'app/',
  
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
      googleClientId: '1094233920540-0p9k7abpr4769drbm70f0f33os3caa9c.apps.googleusercontent.com'
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
  modules: [
    '@pinia/nuxt'
  ] 
})
