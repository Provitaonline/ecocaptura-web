// plugins/buefy.ts
import Buefy from 'buefy'
import 'buefy/dist/css/buefy.css'

export default defineNuxtPlugin((nuxtApp) => {
  // This makes Buefy components available globally
  nuxtApp.vueApp.use(Buefy)
})