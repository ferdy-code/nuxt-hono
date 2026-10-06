<script setup lang="ts">
import { Download, ExternalLink, Save } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })

const route = useRoute()
const { apiFetch } = useApi()

const id = route.params.id as string

interface ContentItem {
  id: string
  title: string
  body: string | null
  contentType: string
  status: string
  platform: string | null
}

const item = ref<ContentItem | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveDone = ref(false)
const exportingNotion = ref(false)
const notionUrl = ref<string | null>(null)
const exportError = ref('')

useHead(() => ({ title: item.value ? `${item.value.title} | AI-COS` : 'Konten | AI-COS' }))

const editTitle = ref('')
const editBody = ref('')

onMounted(async () => {
  try {
    item.value = await apiFetch<ContentItem>(`/api/content/items/${id}`)
    editTitle.value = item.value.title
    editBody.value = item.value.body ?? ''
  }
  finally {
    loading.value = false
  }
})

async function handleSave() {
  if (!item.value)
    return
  saving.value = true
  try {
    await apiFetch(`/api/content/items/${id}`, {
      method: 'PUT',
      body: { title: editTitle.value, body: editBody.value },
    })
    item.value.title = editTitle.value
    item.value.body = editBody.value
    saveDone.value = true
    setTimeout(() => { saveDone.value = false }, 2000)
  }
  finally {
    saving.value = false
  }
}

function handleStatusChange(newStatus: string) {
  if (item.value)
    item.value.status = newStatus
}

async function handleDownloadMarkdown() {
  const config = useRuntimeConfig()
  const response = await fetch(`${config.public.apiUrl}/api/export/${id}/markdown`, {
    credentials: 'include',
  })
  if (!response.ok)
    return

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${editTitle.value.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleExportNotion() {
  exportingNotion.value = true
  exportError.value = ''
  try {
    const result = await apiFetch<{ notionPageUrl: string }>(`/api/export/${id}/notion`, {
      method: 'POST',
    })
    notionUrl.value = result.notionPageUrl
  }
  catch (err: unknown) {
    exportError.value = (err as { data?: { error?: string } })?.data?.error ?? 'Gagal ekspor ke Notion'
  }
  finally {
    exportingNotion.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-10 w-2/3" />
      <Skeleton class="h-96 w-full" />
    </div>

    <div v-else-if="item" class="grid gap-6 lg:grid-cols-4">
      <!-- Editor -->
      <div class="lg:col-span-3 space-y-4">
        <Input
          v-model="editTitle"
          class="text-xl font-bold h-auto px-0 border-0 border-b rounded-none focus-visible:ring-0 focus-visible:border-primary"
          placeholder="Judul konten..."
        />

        <Textarea
          v-model="editBody"
          :rows="20"
          placeholder="Tulis konten di sini (mendukung Markdown)..."
        />

        <div class="flex items-center gap-3 flex-wrap">
          <Button :disabled="saving" @click="handleSave">
            <Save class="h-4 w-4 mr-1.5" />
            {{ saveDone ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan' }}
          </Button>

          <Button variant="outline" size="sm" @click="handleDownloadMarkdown">
            <Download class="h-4 w-4 mr-1.5" />
            Unduh Markdown
          </Button>

          <Button
            variant="outline"
            size="sm"
            :disabled="exportingNotion"
            @click="handleExportNotion"
          >
            <ExternalLink class="h-4 w-4 mr-1.5" />
            {{ exportingNotion ? 'Mengekspor...' : 'Ekspor ke Notion' }}
          </Button>
        </div>

        <div v-if="notionUrl" class="rounded-md border border-green-500/30 bg-green-50 dark:bg-green-900/20 p-3 text-sm">
          Berhasil ekspor!
          <a :href="notionUrl" target="_blank" class="text-primary hover:underline ml-1">Buka di Notion</a>
        </div>

        <Alert v-if="exportError" variant="destructive">
          <AlertTitle>Gagal Ekspor</AlertTitle>
          <AlertDescription>{{ exportError }}</AlertDescription>
        </Alert>
      </div>

      <!-- Approval Panel -->
      <div class="lg:col-span-1">
        <Card class="sticky top-4">
          <CardHeader class="pb-3">
            <CardTitle class="text-sm">
              Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContentApprovalPanel
              :item-id="id"
              :status="item.status"
              @status-change="handleStatusChange"
            />
          </CardContent>
        </Card>
      </div>
    </div>

    <div v-else class="py-12 text-center text-muted-foreground">
      Konten tidak ditemukan.
      <NuxtLink to="/konten" class="text-primary hover:underline ml-1">
        Kembali
      </NuxtLink>
    </div>
  </div>
</template>
