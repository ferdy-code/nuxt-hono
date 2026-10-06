<script setup lang="ts">
definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Pengaturan | AI-COS' })

const { settings, loadSettings, saveSettings } = useSettings()
const saving = ref(false)
const saved = ref(false)
const testingNotion = ref(false)
const notionTestResult = ref<{ ok: boolean, message: string } | null>(null)

const tone = ref('casual')
const style = ref('artikel')
const notionToken = ref('')
const notionDatabaseId = ref('')

onMounted(async () => {
  await loadSettings()
  if (settings.value) {
    tone.value = settings.value.tone
    style.value = settings.value.style
    notionToken.value = settings.value.notionToken ?? ''
    notionDatabaseId.value = settings.value.notionDatabaseId ?? ''
  }
})

async function handleSaveAI() {
  saving.value = true
  try {
    await saveSettings({ tone: tone.value, style: style.value })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  }
  finally {
    saving.value = false
  }
}

async function handleSaveNotion() {
  saving.value = true
  try {
    await saveSettings({
      notionToken: notionToken.value || null,
      notionDatabaseId: notionDatabaseId.value || null,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  }
  finally {
    saving.value = false
  }
}

async function handleTestNotion() {
  testingNotion.value = true
  notionTestResult.value = null
  try {
    const { apiFetch } = useApi()
    await apiFetch('/api/export/test-notion', {
      method: 'POST',
      body: { notionToken: notionToken.value, notionDatabaseId: notionDatabaseId.value },
    })
    notionTestResult.value = { ok: true, message: 'Koneksi berhasil!' }
  }
  catch {
    notionTestResult.value = { ok: false, message: 'Koneksi gagal. Cek token dan database ID.' }
  }
  finally {
    testingNotion.value = false
  }
}

const toneOptions = [
  { value: 'casual', label: 'Kasual', desc: 'Santai, percakapan sehari-hari' },
  { value: 'formal', label: 'Formal', desc: 'Resmi dan profesional' },
  { value: 'technical', label: 'Teknis', desc: 'Mendetail dan berbasis data' },
  { value: 'persuasive', label: 'Persuasif', desc: 'Meyakinkan dan mengajak' },
]

const styleOptions = [
  { value: 'artikel', label: 'Artikel', desc: 'Format tulisan panjang' },
  { value: 'listicle', label: 'Listicle', desc: 'Format daftar poin-poin' },
  { value: 'how-to', label: 'How-To', desc: 'Panduan langkah demi langkah' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Narasi berbasis cerita' },
]
</script>

<template>
  <div class="max-w-2xl space-y-8">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Pengaturan
      </h1>
      <p class="text-muted-foreground">
        Konfigurasi preferensi AI dan integrasi
      </p>
    </div>

    <!-- AI Preferences -->
    <Card>
      <CardHeader>
        <CardTitle>Preferensi AI</CardTitle>
        <CardDescription>Tone dan gaya penulisan default untuk semua fitur AI</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="space-y-3">
          <Label class="text-sm font-medium">Tone</Label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in toneOptions"
              :key="opt.value"
              class="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors" :class="[
                tone === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent',
              ]"
              @click="tone = opt.value"
            >
              <div
                class="mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0"
                :class="tone === opt.value ? 'border-primary' : 'border-muted-foreground'"
              >
                <div v-if="tone === opt.value" class="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p class="text-sm font-medium">
                  {{ opt.label }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ opt.desc }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <Separator />

        <div class="space-y-3">
          <Label class="text-sm font-medium">Gaya Penulisan</Label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in styleOptions"
              :key="opt.value"
              class="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors" :class="[
                style === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent',
              ]"
              @click="style = opt.value"
            >
              <div
                class="mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0"
                :class="style === opt.value ? 'border-primary' : 'border-muted-foreground'"
              >
                <div v-if="style === opt.value" class="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p class="text-sm font-medium">
                  {{ opt.label }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ opt.desc }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button :disabled="saving" @click="handleSaveAI">
          {{ saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Preferensi' }}
        </Button>
      </CardFooter>
    </Card>

    <!-- Notion Integration -->
    <Card>
      <CardHeader>
        <CardTitle>Integrasi Notion</CardTitle>
        <CardDescription>
          Hubungkan ke Notion untuk ekspor konten langsung ke database kamu.
          Buat integration di
          <a href="https://www.notion.so/my-integrations" target="_blank" class="text-primary hover:underline">notion.so/my-integrations</a>.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="notion-token">Notion Integration Token</Label>
          <Input
            id="notion-token"
            v-model="notionToken"
            type="password"
            placeholder="secret_..."
          />
        </div>
        <div class="space-y-2">
          <Label for="notion-db">Database ID</Label>
          <Input
            id="notion-db"
            v-model="notionDatabaseId"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
          <p class="text-xs text-muted-foreground">
            Temukan di URL database Notion: notion.so/[workspace]/[database-id]
          </p>
        </div>

        <div
          v-if="notionTestResult"
          class="rounded-md p-3 text-sm" :class="[
            notionTestResult.ok ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-destructive/10 text-destructive',
          ]"
        >
          {{ notionTestResult.message }}
        </div>
      </CardContent>
      <CardFooter class="gap-2">
        <Button variant="outline" :disabled="testingNotion || !notionToken" @click="handleTestNotion">
          {{ testingNotion ? 'Menguji...' : 'Test Koneksi' }}
        </Button>
        <Button :disabled="saving" @click="handleSaveNotion">
          {{ saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan' }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
