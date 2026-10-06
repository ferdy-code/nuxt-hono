export default defineNuxtPlugin(async () => {
  // Forward browser cookies to the backend — this is the key for SSR session check
  const headers = useRequestHeaders(['cookie'])
  const config = useRuntimeConfig()

  try {
    const data = await $fetch<{ session: object | null } | null>(
      '/api/auth/get-session',
      { baseURL: config.public.apiUrl, headers },
    )
    useState('is-authenticated').value = !!data?.session
  }
  catch {
    useState('is-authenticated').value = false
  }
})
