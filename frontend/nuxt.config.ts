export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  components: [
    { path: '~/components/ui', prefix: '' },
    '~/components',
  ],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:3001',
    },
  },
  compatibilityDate: '2025-06-20',
})
