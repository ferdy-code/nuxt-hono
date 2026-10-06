import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: './components/ui',
  },
  components: [
    { path: '~/components/app', prefix: '' },
    { path: '~/components/ai', prefix: 'Ai' },
    { path: '~/components/content', prefix: 'Content' },
    { path: '~/components/calendar', prefix: 'Calendar' },
    '~/components',
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:3001',
    },
  },
  compatibilityDate: '2025-06-20',
})
