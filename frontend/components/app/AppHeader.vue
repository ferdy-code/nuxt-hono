<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'

const props = defineProps<{ sidebarOpen: boolean }>()
const emit = defineEmits<{ 'update:sidebarOpen': [value: boolean] }>()
</script>

<template>
  <header class="flex h-14 items-center border-b bg-card px-4 lg:hidden">
    <button
      class="mr-3 text-muted-foreground hover:text-foreground"
      @click="emit('update:sidebarOpen', !props.sidebarOpen)"
    >
      <Menu v-if="!sidebarOpen" class="h-5 w-5" />
      <X v-else class="h-5 w-5" />
    </button>
    <span class="text-base font-semibold">AI-COS</span>
  </header>
</template>
