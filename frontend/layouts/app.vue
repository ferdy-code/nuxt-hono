<script setup lang="ts">
const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Mobile sidebar backdrop -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <div
      class="fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:relative lg:translate-x-0" :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <AppSidebar />
    </div>

    <!-- Main content -->
    <div class="flex flex-1 flex-col overflow-hidden min-w-0">
      <AppHeader v-model:sidebar-open="sidebarOpen" />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
