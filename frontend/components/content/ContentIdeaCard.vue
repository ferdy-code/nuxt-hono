<script setup lang="ts">
import { ArrowRight, BookOpen, Trash2 } from 'lucide-vue-next'

export interface ContentIdea {
  id: string
  title: string
  description: string | null
  tags: string[] | null
  platform: string | null
  status: string
}

const props = defineProps<{ idea: ContentIdea }>()
const emit = defineEmits<{
  delete: [id: string]
  outline: [idea: ContentIdea]
}>()
</script>

<template>
  <Card>
    <CardContent class="pt-4 pb-3 space-y-3">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-sm font-semibold leading-snug flex-1">
          {{ idea.title }}
        </h3>
        <Badge variant="outline" class="shrink-0 capitalize">
          {{ idea.platform ?? 'umum' }}
        </Badge>
      </div>

      <p v-if="idea.description" class="text-sm text-muted-foreground leading-relaxed">
        {{ idea.description }}
      </p>

      <div v-if="idea.tags?.length" class="flex flex-wrap gap-1">
        <Badge v-for="tag in idea.tags" :key="tag" variant="secondary" class="text-xs">
          #{{ tag }}
        </Badge>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" class="flex-1" @click="emit('outline', idea)">
          <BookOpen class="h-3.5 w-3.5 mr-1.5" />
          Buat Outline
        </Button>
        <NuxtLink :to="`/outline?topic=${encodeURIComponent(idea.title)}`">
          <Button size="sm" variant="ghost">
            <ArrowRight class="h-4 w-4" />
          </Button>
        </NuxtLink>
        <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="emit('delete', idea.id)">
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
