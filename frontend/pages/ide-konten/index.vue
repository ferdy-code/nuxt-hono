<script setup lang="ts">
import type { ContentIdea } from '~/components/content/ContentIdeaCard.vue'
import { Sparkles } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Ide Konten | AI-COS' })

const { apiFetch } = useApi()
const { streamText, isStreaming, error: streamError, startStream, reset } = useAiStream()

const topic = ref('')
const count = ref('5')
const platform = ref('blog')
const filterStatus = ref('all')

const savedIdeas = ref<ContentIdea[]>([])
const generatedIdeas = ref<ContentIdea[]>([])
const savingIds = ref<Set<string>>(new Set())

async function loadIdeas() {
  try {
    const params = filterStatus.value !== 'all' ? `?status=${filterStatus.value}` : ''
    savedIdeas.value = await apiFetch<ContentIdea[]>(`/api/content/ideas${params}`)
  }
  catch { /* noop */ }
}

onMounted(loadIdeas)
watch(filterStatus, loadIdeas)

async function handleGenerate() {
  if (!topic.value.trim())
    return
  generatedIdeas.value = []
  reset()

  await startStream('/api/ai/ideas', {
    topic: topic.value,
    count: Number(count.value),
    platform: platform.value,
  })

  if (streamText.value) {
    try {
      let raw = streamText.value.trim()
      raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '')
      const parsed = JSON.parse(raw)
      generatedIdeas.value = Array.isArray(parsed)
        ? parsed.map((item: ContentIdea, i: number) => ({
            ...item,
            id: `gen-${i}`,
            status: 'generated',
            platform: platform.value,
          }))
        : []
    }
    catch {
      // Show raw text if JSON parse fails
    }
  }
}

async function saveIdea(idea: ContentIdea) {
  const tempId = idea.id
  savingIds.value.add(tempId)
  try {
    await apiFetch('/api/content/ideas', {
      method: 'POST',
      body: {
        title: idea.title,
        description: idea.description,
        tags: idea.tags,
        platform: idea.platform ?? platform.value,
      },
    })
    generatedIdeas.value = generatedIdeas.value.filter(i => i.id !== tempId)
    await loadIdeas()
  }
  finally {
    savingIds.value.delete(tempId)
  }
}

async function deleteIdea(id: string) {
  await apiFetch(`/api/content/ideas/${id}`, { method: 'DELETE' })
  savedIdeas.value = savedIdeas.value.filter(i => i.id !== id)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Ide Konten
      </h1>
      <p class="text-muted-foreground">
        Generate ide konten dengan bantuan AI
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Generator Form -->
      <div class="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">
              Generator Ide
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="topic">Topik</Label>
              <Input
                id="topic"
                v-model="topic"
                placeholder="Contoh: Digital marketing untuk UMKM"
                @keyup.enter="handleGenerate"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-2">
                <Label>Jumlah</Label>
                <Select v-model="count">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">
                      3 ide
                    </SelectItem>
                    <SelectItem value="5">
                      5 ide
                    </SelectItem>
                    <SelectItem value="10">
                      10 ide
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>Platform</Label>
                <Select v-model="platform">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">
                      Blog
                    </SelectItem>
                    <SelectItem value="twitter">
                      Twitter/X
                    </SelectItem>
                    <SelectItem value="linkedin">
                      LinkedIn
                    </SelectItem>
                    <SelectItem value="instagram">
                      Instagram
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button class="w-full" :disabled="isStreaming || !topic.trim()" @click="handleGenerate">
              <Sparkles class="h-4 w-4 mr-2" />
              {{ isStreaming ? 'Generating...' : 'Generate Ide' }}
            </Button>
          </CardContent>
        </Card>

        <!-- Stream output (raw) when generating -->
        <div v-if="isStreaming || (streamText && generatedIdeas.length === 0 && !streamError)">
          <AiStreamingOutput :text="streamText" :is-streaming="isStreaming" />
        </div>

        <Alert v-if="streamError" variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{{ streamError }}</AlertDescription>
        </Alert>
      </div>

      <!-- Results -->
      <div class="lg:col-span-3 space-y-4">
        <!-- Generated ideas (not yet saved) -->
        <div v-if="generatedIdeas.length > 0" class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">
              Hasil Generate ({{ generatedIdeas.length }})
            </h2>
            <Button variant="outline" size="sm" @click="generatedIdeas.forEach(i => saveIdea(i))">
              Simpan Semua
            </Button>
          </div>
          <div class="space-y-3">
            <div v-for="idea in generatedIdeas" :key="idea.id" class="relative">
              <ContentIdeaCard
                :idea="idea"
                @delete="generatedIdeas = generatedIdeas.filter(i => i.id !== idea.id)"
                @outline="() => {}"
              />
              <Button
                size="sm"
                class="absolute bottom-3 right-16"
                :disabled="savingIds.has(idea.id)"
                @click="saveIdea(idea)"
              >
                {{ savingIds.has(idea.id) ? 'Menyimpan...' : 'Simpan' }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Saved ideas -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">
              Tersimpan
            </h2>
            <Select v-model="filterStatus" class="w-36">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Semua
                </SelectItem>
                <SelectItem value="saved">
                  Tersimpan
                </SelectItem>
                <SelectItem value="used">
                  Digunakan
                </SelectItem>
                <SelectItem value="archived">
                  Diarsipkan
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="savedIdeas.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            Belum ada ide tersimpan
          </div>

          <div v-else class="space-y-3">
            <ContentIdeaCard
              v-for="idea in savedIdeas"
              :key="idea.id"
              :idea="idea"
              @delete="deleteIdea"
              @outline="navigateTo(`/outline?topic=${encodeURIComponent($event.title)}`)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
