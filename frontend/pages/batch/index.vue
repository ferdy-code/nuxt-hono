<script setup lang="ts">
import { ExternalLink, RefreshCw } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Batch Generate | AI-COS' })

const { apiFetch } = useApi()

interface BatchJob {
  id: string
  jobType: string
  status: string
  totalItems: number
  completedItems: number
  params: string | null
  results: string | null
  createdAt: string
}

const jobs = ref<BatchJob[]>([])
const loading = ref(true)
const submitting = ref(false)
const pollingJobId = ref<string | null>(null)

const form = ref({
  jobType: 'ideas',
  topicsRaw: '',
  platform: 'blog',
})

async function loadJobs() {
  jobs.value = await apiFetch<BatchJob[]>('/api/batch')
}

onMounted(async () => {
  try {
    await loadJobs()
  }
  finally {
    loading.value = false
  }
})

async function handleSubmit() {
  const topics = form.value.topicsRaw
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean)

  if (topics.length === 0)
    return

  submitting.value = true
  try {
    const job = await apiFetch<BatchJob>('/api/batch', {
      method: 'POST',
      body: {
        jobType: form.value.jobType,
        topics,
        platform: form.value.platform,
      },
    })
    jobs.value = [job, ...jobs.value]
    pollingJobId.value = job.id
    pollJob(job.id)
    form.value.topicsRaw = ''
  }
  finally {
    submitting.value = false
  }
}

async function pollJob(jobId: string) {
  const interval = setInterval(async () => {
    try {
      const updated = await apiFetch<BatchJob>(`/api/batch/${jobId}`)
      const idx = jobs.value.findIndex(j => j.id === jobId)
      if (idx >= 0)
        jobs.value[idx] = updated

      if (updated.status === 'completed' || updated.status === 'failed') {
        clearInterval(interval)
        if (pollingJobId.value === jobId)
          pollingJobId.value = null
      }
    }
    catch {
      clearInterval(interval)
    }
  }, 3000)
}

function progressPercent(job: BatchJob) {
  if (job.totalItems === 0)
    return 0
  return Math.round((job.completedItems / job.totalItems) * 100)
}

function parseResults(job: BatchJob): string[] {
  try {
    return JSON.parse(job.results ?? '[]')
  }
  catch {
    return []
  }
}

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Memproses',
  completed: 'Selesai',
  failed: 'Gagal',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Batch Generate
      </h1>
      <p class="text-muted-foreground">
        Generate banyak konten sekaligus dari daftar topik
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Form -->
      <div class="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">
              Konfigurasi Batch
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Tipe Konten</Label>
              <Select v-model="form.jobType">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ideas">
                    Ide Konten
                  </SelectItem>
                  <SelectItem value="outlines">
                    Outline Artikel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Platform</Label>
              <Select v-model="form.platform">
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

            <div class="space-y-2">
              <Label for="topics">Topik (satu per baris)</Label>
              <Textarea
                id="topics"
                v-model="form.topicsRaw"
                placeholder="Tips produktivitas kerja&#10;Digital marketing UMKM&#10;Cara investasi untuk pemula"
                :rows="8"
              />
              <p class="text-xs text-muted-foreground">
                {{ form.topicsRaw.split('\n').filter(t => t.trim()).length }} topik
              </p>
            </div>

            <Button
              class="w-full"
              :disabled="submitting || !form.topicsRaw.trim()"
              @click="handleSubmit"
            >
              {{ submitting ? 'Memulai...' : 'Mulai Batch' }}
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Jobs List -->
      <div class="lg:col-span-3 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">
            Riwayat Batch
          </h2>
          <Button variant="ghost" size="sm" @click="loadJobs">
            <RefreshCw class="h-4 w-4" />
          </Button>
        </div>

        <div v-if="loading" class="space-y-3">
          <Skeleton v-for="i in 3" :key="i" class="h-28 w-full" />
        </div>

        <div v-else-if="jobs.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          Belum ada batch job
        </div>

        <div v-else class="space-y-3">
          <Card v-for="job in jobs" :key="job.id">
            <CardContent class="pt-4 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium capitalize">
                    {{ job.jobType === 'ideas' ? 'Ide Konten' : 'Outline' }} —
                    {{ job.totalItems }} topik
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDate(job.createdAt) }}
                  </p>
                </div>
                <Badge
                  :variant="job.status === 'completed' ? 'success' : job.status === 'failed' ? 'destructive' : 'warning'"
                >
                  {{ statusLabel[job.status] ?? job.status }}
                </Badge>
              </div>

              <div v-if="job.status === 'processing' || (job.status === 'completed' && job.totalItems > 0)">
                <div class="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{{ job.completedItems }}/{{ job.totalItems }} selesai</span>
                  <span>{{ progressPercent(job) }}%</span>
                </div>
                <Progress :value="progressPercent(job)" />
              </div>

              <div v-if="job.status === 'completed' && parseResults(job).length > 0" class="flex flex-wrap gap-2">
                <NuxtLink
                  v-for="itemId in parseResults(job).slice(0, 5)"
                  :key="itemId"
                  :to="`/konten/${itemId}`"
                >
                  <Button variant="outline" size="sm" class="h-7 text-xs">
                    <ExternalLink class="h-3 w-3 mr-1" />
                    Lihat Konten
                  </Button>
                </NuxtLink>
                <span v-if="parseResults(job).length > 5" class="text-xs text-muted-foreground self-center">
                  +{{ parseResults(job).length - 5 }} lagi di Konten Saya
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
