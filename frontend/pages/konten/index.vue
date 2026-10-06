<script setup lang="ts">
import type { ContentItem } from '~/components/content/ContentItemCard.vue'
import { Plus } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Konten Saya | AI-COS' })

const { apiFetch } = useApi()
const items = ref<ContentItem[]>([])
const loading = ref(true)
const filterStatus = ref('all')
const filterType = ref('all')

async function loadItems() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterStatus.value && filterStatus.value !== 'all')
      params.set('status', filterStatus.value)
    if (filterType.value && filterType.value !== 'all')
      params.set('contentType', filterType.value)
    const query = params.toString() ? `?${params}` : ''
    items.value = await apiFetch<ContentItem[]>(`/api/content/items${query}`)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadItems)
watch([filterStatus, filterType], loadItems)

async function deleteItem(id: string) {
  await apiFetch(`/api/content/items/${id}`, { method: 'DELETE' })
  items.value = items.value.filter(i => i.id !== id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Konten Saya
        </h1>
        <p class="text-muted-foreground">
          Kelola semua konten yang sudah dibuat
        </p>
      </div>
      <NuxtLink to="/ide-konten">
        <Button size="sm">
          <Plus class="h-4 w-4 mr-1.5" />
          Konten Baru
        </Button>
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <Select v-model="filterStatus" class="w-40">
        <SelectTrigger>
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Semua Status
          </SelectItem>
          <SelectItem value="draft">
            Draft
          </SelectItem>
          <SelectItem value="pending_review">
            Review
          </SelectItem>
          <SelectItem value="approved">
            Disetujui
          </SelectItem>
          <SelectItem value="rejected">
            Ditolak
          </SelectItem>
          <SelectItem value="published">
            Published
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="filterType" class="w-40">
        <SelectTrigger>
          <SelectValue placeholder="Semua Tipe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Semua Tipe
          </SelectItem>
          <SelectItem value="article">
            Artikel
          </SelectItem>
          <SelectItem value="outline">
            Outline
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

    <!-- List -->
    <Card>
      <CardContent class="p-0">
        <div v-if="loading" class="p-6 space-y-3">
          <Skeleton v-for="i in 5" :key="i" class="h-14 w-full" />
        </div>

        <div v-else-if="items.length === 0" class="py-12 text-center text-sm text-muted-foreground">
          Belum ada konten. Mulai dari
          <NuxtLink to="/ide-konten" class="text-primary hover:underline">
            Ide Konten
          </NuxtLink>
          atau
          <NuxtLink to="/outline" class="text-primary hover:underline">
            Buat Outline
          </NuxtLink>.
        </div>

        <div v-else class="divide-y">
          <ContentItemCard
            v-for="item in items"
            :key="item.id"
            :item="item"
            @delete="deleteItem"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
