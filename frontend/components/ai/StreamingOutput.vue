<script setup lang="ts">
defineProps<{
  text: string
  isStreaming: boolean
  placeholder?: string
}>()
</script>

<template>
  <div class="relative min-h-[120px] rounded-md border bg-muted/30 p-4">
    <div v-if="isStreaming" class="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <span class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      Generating...
    </div>
    <pre v-if="text" class="text-sm whitespace-pre-wrap font-sans leading-relaxed">{{ text }}</pre>
    <p v-else-if="!isStreaming" class="text-sm text-muted-foreground italic">
      {{ placeholder ?? 'Hasil akan muncul di sini...' }}
    </p>
  </div>
</template>
