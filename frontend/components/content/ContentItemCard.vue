<script setup lang="ts">
import { MoreHorizontal, Trash2 } from 'lucide-vue-next'

export interface ContentItem {
  id: string
  title: string
  contentType: string
  status: string
  platform: string | null
  createdAt: string
  updatedAt: string
}

defineProps<{ item: ContentItem }>()
const emit = defineEmits<{ delete: [id: string] }>()

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
  <div class="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors rounded-md">
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate">
        {{ item.title }}
      </p>
      <p class="text-xs text-muted-foreground capitalize mt-0.5">
        {{ item.contentType }} • {{ item.platform ?? 'umum' }}
      </p>
    </div>
    <Badge :variant="statusVariant[item.status] ?? 'outline'" class="shrink-0">
      {{ statusLabel[item.status] ?? item.status }}
    </Badge>
    <div class="flex items-center gap-1">
      <NuxtLink :to="`/konten/${item.id}`">
        <Button variant="ghost" size="sm">
          <MoreHorizontal class="h-4 w-4" />
        </Button>
      </NuxtLink>
      <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="emit('delete', item.id)">
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
