export function useAiStream() {
  const streamText = ref('')
  const isStreaming = ref(false)
  const error = ref('')
  const config = useRuntimeConfig()

  async function startStream(endpoint: string, body: Record<string, unknown>) {
    streamText.value = ''
    isStreaming.value = true
    error.value = ''

    try {
      const response = await fetch(`${config.public.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        error.value = `Gagal: ${response.statusText}`
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        streamText.value += decoder.decode(value, { stream: true })
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Terjadi kesalahan'
    }
    finally {
      isStreaming.value = false
    }
  }

  function reset() {
    streamText.value = ''
    error.value = ''
  }

  return { streamText, isStreaming, error, startStream, reset }
}
