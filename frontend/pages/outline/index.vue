<script setup lang="ts">
import { Save, Sparkles } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Buat Outline | AI-COS' })

const route = useRoute()
const { apiFetch } = useApi()
const { streamText, isStreaming, error: streamError, startStream, reset } = useAiStream()

const topic = ref((route.query.topic as string) ?? '')
const targetLength = ref('medium')
const savedItemId = ref<string | null>(null)
const saving = ref(false)

async function handleGenerate() {
  if (!topic.value.trim())
    return
  savedItemId.value = null
  reset()
  await startStream('/api/ai/outline', {
    topic: topic.value,
    targetLength: targetLength.value,
  })
}

async function handleSave() {
  if (!streamText.value)
    return
  saving.value = true
  try {
    const item = await apiFetch<{ id: string }>('/api/content/items', {
      method: 'POST',
      body: {
        title: `Outline: ${topic.value}`,
        body: streamText.value,
        contentType: 'outline',
        platform: 'blog',
      },
    })
    savedItemId.value = item.id
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Buat Outline
      </h1>
      <p class="text-muted-foreground">
        Generate struktur artikel lengkap dengan AI
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">
              Konfigurasi
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="topic">Topik Artikel</Label>
              <Input
                id="topic"
                v-model="topic"
                placeholder="Contoh: Cara membangun startup di Indonesia"
              />
            </div>

            <div class="space-y-2">
              <Label>Panjang Target</Label>
              <Select v-model="targetLength">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">
                    Pendek (~500 kata)
                  </SelectItem>
                  <SelectItem value="medium">
                    Sedang (~1000 kata)
                  </SelectItem>
                  <SelectItem value="long">
                    Panjang (~2000 kata)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button class="w-full" :disabled="isStreaming || !topic.trim()" @click="handleGenerate">
              <Sparkles class="h-4 w-4 mr-2" />
              {{ isStreaming ? 'Generating...' : 'Generate Outline' }}
            </Button>
          </CardContent>
        </Card>

        <Alert v-if="streamError" variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{{ streamError }}</AlertDescription>
        </Alert>

        <Alert v-if="savedItemId" class="border-green-500/50 bg-green-50 dark:bg-green-900/20">
          <AlertTitle class="text-green-800 dark:text-green-400">
            Tersimpan!
          </AlertTitle>
          <AlertDescription class="text-green-700 dark:text-green-500">
            <NuxtLink :to="`/konten/${savedItemId}`" class="underline">
              Lihat di Konten Saya
            </NuxtLink>
          </AlertDescription>
        </Alert>
      </div>

      <!-- Output -->
      <div class="lg:col-span-3 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">
            Hasil Outline
          </h2>
          <Button
            v-if="streamText && !isStreaming"
            size="sm"
            variant="outline"
            :disabled="saving"
            @click="handleSave"
          >
            <Save class="h-4 w-4 mr-1.5" />
            {{ saving ? 'Menyimpan...' : 'Simpan ke Konten' }}
          </Button>
        </div>

        <AiStreamingOutput
          :text="streamText"
          :is-streaming="isStreaming"
          placeholder="Outline akan muncul di sini setelah kamu klik Generate"
        />
      </div>
    </div>
  </div>
</template>
