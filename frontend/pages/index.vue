<script setup lang="ts">
import { Calendar, FileText, FolderOpen, Lightbulb, Plus } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Dasbor | AI-COS' })

const { apiFetch } = useApi()

interface ContentItem {
  id: string
  title: string
  contentType: string
  status: string
  platform: string | null
  createdAt: string
}

interface Stats {
  ideas: number
  items: number
  pending: number
  scheduled: number
}

const stats = ref<Stats>({ ideas: 0, items: 0, pending: 0, scheduled: 0 })
const recentItems = ref<ContentItem[]>([])
const loading = ref(true)

async function loadData() {
  try {
    const [ideas, items, calendarEvents] = await Promise.all([
      apiFetch<ContentItem[]>('/api/content/ideas'),
      apiFetch<ContentItem[]>('/api/content/items'),
      apiFetch<ContentItem[]>('/api/calendar'),
    ])

    stats.value = {
      ideas: ideas.length,
      items: items.length,
      pending: items.filter(i => i.status === 'pending_review').length,
      scheduled: calendarEvents.length,
    }
    recentItems.value = items.slice(0, 5)
  }
  catch {
    // silent fail on dashboard
  }
  finally {
    loading.value = false
  }
}

onMounted(loadData)

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  draft: 'outline',
  pending_review: 'warning',
  approved: 'success',
  rejected: 'destructive',
  published: 'default',
}

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Review',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  published: 'Published',
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Dasbor
      </h1>
      <p class="text-muted-foreground">
        Selamat datang di AI Content OS
      </p>
    </div>

    <!-- Stat Cards -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div class="rounded-full bg-primary/10 p-2">
              <Lightbulb class="h-5 w-5 text-primary" />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ stats.ideas }}
              </p>
              <p class="text-xs text-muted-foreground">
                Ide Konten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div class="rounded-full bg-blue-500/10 p-2">
              <FolderOpen class="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ stats.items }}
              </p>
              <p class="text-xs text-muted-foreground">
                Total Konten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div class="rounded-full bg-yellow-500/10 p-2">
              <FileText class="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ stats.pending }}
              </p>
              <p class="text-xs text-muted-foreground">
                Perlu Review
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-4">
            <div class="rounded-full bg-green-500/10 p-2">
              <Calendar class="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ stats.scheduled }}
              </p>
              <p class="text-xs text-muted-foreground">
                Dijadwalkan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div>
      <h2 class="text-base font-semibold mb-3">
        Aksi Cepat
      </h2>
      <div class="flex flex-wrap gap-2">
        <Button as-child size="sm">
          <NuxtLink to="/ide-konten">
            <Plus class="h-4 w-4 mr-1" />
            Ide Baru
          </NuxtLink>
        </Button>
        <Button as-child variant="outline" size="sm">
          <NuxtLink to="/outline">
            <FileText class="h-4 w-4 mr-1" />
            Buat Outline
          </NuxtLink>
        </Button>
        <Button as-child variant="outline" size="sm">
          <NuxtLink to="/calendar">
            <Calendar class="h-4 w-4 mr-1" />
            Lihat Kalender
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Recent Content -->
    <div>
      <h2 class="text-base font-semibold mb-3">
        Konten Terbaru
      </h2>
      <Card>
        <CardContent class="p-0">
          <div v-if="loading" class="p-6 space-y-3">
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
          </div>
          <div v-else-if="recentItems.length === 0" class="p-8 text-center text-muted-foreground text-sm">
            Belum ada konten. Mulai dengan membuat ide!
          </div>
          <div v-else class="divide-y">
            <NuxtLink
              v-for="item in recentItems"
              :key="item.id"
              :to="`/konten/${item.id}`"
              class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">
                  {{ item.title }}
                </p>
                <p class="text-xs text-muted-foreground capitalize">
                  {{ item.contentType }} • {{ item.platform ?? 'umum' }}
                </p>
              </div>
              <Badge :variant="statusVariant[item.status] ?? 'outline'">
                {{ statusLabel[item.status] ?? item.status }}
              </Badge>
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
