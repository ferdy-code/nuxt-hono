<script setup lang="ts">
import {
  Calendar,
  FileText,
  FolderOpen,
  Layers,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  RefreshCw,
  Settings,
} from 'lucide-vue-next'
import { authClient } from '~/lib/auth-client'

const route = useRoute()

const navItems = [
  { href: '/', label: 'Dasbor', icon: LayoutDashboard, exact: true },
  { href: '/ide-konten', label: 'Ide Konten', icon: Lightbulb },
  { href: '/outline', label: 'Buat Outline', icon: FileText },
  { href: '/repurpose', label: 'Repurpose', icon: RefreshCw },
  { href: '/konten', label: 'Konten Saya', icon: FolderOpen },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/batch', label: 'Batch Generate', icon: Layers },
  { href: '/pengaturan', label: 'Pengaturan', icon: Settings },
]

const { data: session } = authClient.useSession(useFetch)

function isActive(item: { href: string, exact?: boolean }) {
  if (item.exact)
    return route.path === item.href
  return route.path === item.href || route.path.startsWith(`${item.href}/`)
}

async function handleSignOut() {
  await authClient.signOut()
  useState('is-authenticated').value = false
  await navigateTo('/login')
}
</script>

<template>
  <aside class="flex h-full w-64 flex-col border-r bg-card">
    <div class="flex h-16 items-center border-b px-6">
      <span class="text-lg font-bold tracking-tight">AI-COS</span>
    </div>

    <nav class="flex-1 overflow-y-auto p-3 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.href"
        :to="item.href"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="[
          isActive(item)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        ]"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t p-3">
      <div class="flex items-center gap-3 rounded-md px-3 py-2">
        <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
          {{ session?.user?.name?.charAt(0)?.toUpperCase() ?? '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">
            {{ session?.user?.name }}
          </p>
          <p class="text-xs text-muted-foreground truncate">
            {{ session?.user?.email }}
          </p>
        </div>
        <button
          class="text-muted-foreground hover:text-foreground transition-colors"
          title="Keluar"
          @click="handleSignOut"
        >
          <LogOut class="h-4 w-4" />
        </button>
      </div>
    </div>
  </aside>
</template>
