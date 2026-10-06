export function useApi() {
  const config = useRuntimeConfig()

  function apiFetch<T>(path: string, options?: Parameters<typeof $fetch>[1]) {
    return $fetch<T>(path, {
      baseURL: config.public.apiUrl,
      credentials: 'include',
      ...options,
    })
  }

  return { apiFetch }
}
