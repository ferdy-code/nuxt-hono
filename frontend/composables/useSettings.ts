export interface UserSettings {
  id: string
  userId: string
  tone: string
  style: string
  language: string
  notionToken: string | null
  notionDatabaseId: string | null
}

const settings = ref<UserSettings | null>(null)

export function useSettings() {
  const { apiFetch } = useApi()

  async function loadSettings() {
    try {
      settings.value = await apiFetch<UserSettings>('/api/settings')
    }
    catch {
      settings.value = null
    }
  }

  async function saveSettings(data: Partial<UserSettings>) {
    settings.value = await apiFetch<UserSettings>('/api/settings', {
      method: 'PUT',
      body: data,
    })
  }

  return { settings, loadSettings, saveSettings }
}
