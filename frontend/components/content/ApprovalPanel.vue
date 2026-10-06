<script setup lang="ts">
import { Send } from 'lucide-vue-next'

interface Comment {
  id: string
  comment: string
  userId: string
  createdAt: string
}

const props = defineProps<{
  itemId: string
  status: string
}>()

const emit = defineEmits<{ statusChange: [status: string] }>()

const { apiFetch } = useApi()
const comments = ref<Comment[]>([])
const newComment = ref('')
const posting = ref(false)
const actionLoading = ref(false)

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Menunggu Review',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  published: 'Published',
}

const statusVariant: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  rejected: 'bg-destructive/10 text-destructive',
  published: 'bg-primary text-primary-foreground',
}

async function loadComments() {
  comments.value = await apiFetch<Comment[]>(`/api/content/items/${props.itemId}/comments`)
}

onMounted(loadComments)

async function submit() {
  actionLoading.value = true
  try {
    await apiFetch(`/api/content/items/${props.itemId}/submit`, { method: 'POST' })
    emit('statusChange', 'pending_review')
  }
  finally {
    actionLoading.value = false
  }
}

async function approve() {
  actionLoading.value = true
  try {
    await apiFetch(`/api/content/items/${props.itemId}/approve`, { method: 'POST' })
    emit('statusChange', 'approved')
  }
  finally {
    actionLoading.value = false
  }
}

async function reject() {
  actionLoading.value = true
  try {
    await apiFetch(`/api/content/items/${props.itemId}/reject`, {
      method: 'POST',
      body: { reason: newComment.value || 'Ditolak' },
    })
    emit('statusChange', 'rejected')
    newComment.value = ''
    await loadComments()
  }
  finally {
    actionLoading.value = false
  }
}

async function postComment() {
  if (!newComment.value.trim())
    return
  posting.value = true
  try {
    await apiFetch(`/api/content/items/${props.itemId}/comments`, {
      method: 'POST',
      body: { comment: newComment.value },
    })
    newComment.value = ''
    await loadComments()
  }
  finally {
    posting.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Status -->
    <div>
      <p class="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
        Status
      </p>
      <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="[statusVariant[status] ?? 'bg-muted']">
        {{ statusLabel[status] ?? status }}
      </span>
    </div>

    <Separator />

    <!-- Actions -->
    <div class="space-y-2">
      <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Aksi
      </p>

      <Button
        v-if="status === 'draft' || status === 'rejected'"
        variant="outline"
        size="sm"
        class="w-full"
        :disabled="actionLoading"
        @click="submit"
      >
        Kirim untuk Review
      </Button>

      <template v-if="status === 'pending_review'">
        <Button
          size="sm"
          class="w-full bg-green-600 hover:bg-green-700 text-white"
          :disabled="actionLoading"
          @click="approve"
        >
          Setujui
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          :disabled="actionLoading"
          @click="reject"
        >
          Tolak
        </Button>
      </template>
    </div>

    <Separator />

    <!-- Comments -->
    <div class="space-y-3">
      <p class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Komentar ({{ comments.length }})
      </p>

      <div class="space-y-2 max-h-48 overflow-y-auto">
        <div v-if="comments.length === 0" class="text-xs text-muted-foreground italic">
          Belum ada komentar
        </div>
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="rounded-md bg-muted/50 p-2.5"
        >
          <p class="text-xs leading-relaxed">
            {{ comment.comment }}
          </p>
          <p class="text-[10px] text-muted-foreground mt-1">
            {{ formatDate(comment.createdAt) }}
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <Input
          v-model="newComment"
          placeholder="Tulis komentar..."
          class="text-sm h-8"
          @keyup.enter="postComment"
        />
        <Button size="sm" class="h-8 px-2.5" :disabled="posting || !newComment.trim()" @click="postComment">
          <Send class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
