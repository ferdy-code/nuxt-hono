<script setup lang="ts">
import { Save, Sparkles } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Repurpose Artikel | AI-COS' })

const { apiFetch } = useApi()
const { streamText, isStreaming, error: streamError, startStream, reset } = useAiStream()

const articleContent = ref('')
const selectedPlatforms = ref<string[]>(['twitter'])
const savedAll = ref(false)
const saving = ref(false)

const platforms = [
  { value: 'twitter', label: 'Twitter/X', maxChars: 280 },
  { value: 'linkedin', label: 'LinkedIn', maxChars: null },
  { value: 'instagram', label: 'Instagram', maxChars: 2200 },
]

function togglePlatform(value: string) {
  const idx = selectedPlatforms.value.indexOf(value)
  if (idx >= 0) {
    if (selectedPlatforms.value.length > 1) {
      selectedPlatforms.value.splice(idx, 1)
    }
  }
  else {
    selectedPlatforms.value.push(value)
  }
}

async function handleGenerate() {
  if (!articleContent.value.trim())
    return
  savedAll.value = false
  reset()
  await startStream('/api/ai/repurpose', {
    articleContent: articleContent.value,
    platforms: selectedPlatforms.value,
  })
}

// Parse streaming output into sections per platform
const parsedSections = computed(() => {
  if (!streamText.value)
    return {}
  const result: Record<string, string> = {}
  const regex = /---PLATFORM: (\w+)---([\s\S]*?)---END: \w+---/g
  let match
  while ((match = regex.exec(streamText.value)) !== null) {
    result[match[1]] = match[2].trim()
  }
  return result
})

const activeTab = ref('twitter')
watch(selectedPlatforms, (platforms) => {
  if (!platforms.includes(activeTab.value)) {
    activeTab.value = platforms[0]
  }
}, { immediate: true })

async function saveAll() {
  if (Object.keys(parsedSections.value).length === 0)
    return
  saving.value = true
  try {
    for (const [platform, body] of Object.entries(parsedSections.value)) {
      await apiFetch('/api/content/items', {
        method: 'POST',
        body: {
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`,
          body,
          contentType: platform,
          platform,
        },
      })
    }
    savedAll.value = true
  }
  finally {
    saving.value = false
  }
}

function charCount(text: string) {
  return text?.length ?? 0
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Repurpose Artikel
      </h1>
      <p class="text-muted-foreground">
        Ubah artikel menjadi post media sosial
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">
              Artikel Sumber
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="article">Tempel Artikel</Label>
              <Textarea
                id="article"
                v-model="articleContent"
                placeholder="Tempel konten artikel di sini..."
                :rows="10"
              />
            </div>

            <div class="space-y-2">
              <Label>Target Platform</Label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="p in platforms"
                  :key="p.value"
                  class="rounded-full px-3 py-1 text-xs font-medium border transition-colors" :class="[
                    selectedPlatforms.includes(p.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-accent',
                  ]"
                  @click="togglePlatform(p.value)"
                >
                  {{ p.label }}
                </button>
              </div>
            </div>

            <Button class="w-full" :disabled="isStreaming || !articleContent.trim()" @click="handleGenerate">
              <Sparkles class="h-4 w-4 mr-2" />
              {{ isStreaming ? 'Generating...' : 'Repurpose' }}
            </Button>
          </CardContent>
        </Card>

        <Alert v-if="streamError" variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{{ streamError }}</AlertDescription>
        </Alert>

        <Alert v-if="savedAll" class="border-green-500/50 bg-green-50 dark:bg-green-900/20">
          <AlertTitle class="text-green-800 dark:text-green-400">
            Semua tersimpan!
          </AlertTitle>
          <AlertDescription class="text-green-700 dark:text-green-500">
            <NuxtLink to="/konten" class="underline">
              Lihat di Konten Saya
            </NuxtLink>
          </AlertDescription>
        </Alert>
      </div>

      <!-- Results Tabs -->
      <div class="lg:col-span-3 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">
            Hasil
          </h2>
          <Button
            v-if="Object.keys(parsedSections).length > 0 && !isStreaming"
            size="sm"
            variant="outline"
            :disabled="saving || savedAll"
            @click="saveAll"
          >
            <Save class="h-4 w-4 mr-1.5" />
            {{ saving ? 'Menyimpan...' : 'Simpan Semua' }}
          </Button>
        </div>

        <!-- Show raw stream while still generating -->
        <div v-if="isStreaming && Object.keys(parsedSections).length === 0">
          <AiStreamingOutput :text="streamText" :is-streaming="isStreaming" />
        </div>

        <!-- Parsed tabs -->
        <div v-else-if="Object.keys(parsedSections).length > 0">
          <Tabs v-model="activeTab">
            <TabsList>
              <TabsTrigger
                v-for="p in platforms.filter(p => selectedPlatforms.includes(p.value))"
                :key="p.value"
                :value="p.value"
              >
                {{ p.label }}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              v-for="p in platforms.filter(p => selectedPlatforms.includes(p.value))"
              :key="p.value"
              :value="p.value"
            >
              <div class="space-y-2">
                <div class="relative rounded-md border bg-muted/30 p-4">
                  <pre class="text-sm whitespace-pre-wrap font-sans leading-relaxed">{{ parsedSections[p.value] ?? 'Sedang di-generate...' }}</pre>
                </div>
                <div v-if="p.maxChars" class="text-right text-xs" :class="charCount(parsedSections[p.value]) > p.maxChars ? 'text-destructive' : 'text-muted-foreground'">
                  {{ charCount(parsedSections[p.value]) }} / {{ p.maxChars }} karakter
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div v-else-if="!isStreaming && !streamError">
          <AiStreamingOutput text="" :is-streaming="false" placeholder="Hasil repurpose akan muncul di sini per platform" />
        </div>
      </div>
    </div>
  </div>
</template>
