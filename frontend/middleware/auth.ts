import { authClient } from '~/lib/auth-client'

export default defineNuxtRouteMiddleware(async () => {
  const isAuthenticated = useState<boolean | null>('is-authenticated', () => null)

  if (isAuthenticated.value === null) {
    // Client-side only fallback (browser sendiri menyertakan cookie secara otomatis)
    const result = await authClient.getSession()
    isAuthenticated.value = !!result?.data?.session
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
