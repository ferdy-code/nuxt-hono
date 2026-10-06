<script setup lang="ts">
import type { CalendarEvent } from '~/components/calendar/CalendarGrid.vue'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-vue-next'

definePageMeta({ layout: 'app', middleware: 'auth' })
useHead({ title: 'Kalender | AI-COS' })

const { apiFetch } = useApi()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)

const events = ref<CalendarEvent[]>([])
const loading = ref(true)

const selectedDay = ref<Date | null>(null)
const selectedDayEvents = ref<CalendarEvent[]>([])
const showAddDialog = ref(false)
const showDayDialog = ref(false)

const newEvent = ref({ title: '', scheduledDate: '', platform: 'blog', notes: '' })
const saving = ref(false)

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else { currentMonth.value-- }
}

function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else { currentMonth.value++ }
}

async function loadEvents() {
  loading.value = true
  try {
    events.value = await apiFetch<CalendarEvent[]>(`/api/calendar?month=${currentMonth.value}&year=${currentYear.value}`)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadEvents)
watch([currentMonth, currentYear], loadEvents)

function handleDayClick(date: Date, dayEvents: CalendarEvent[]) {
  selectedDay.value = date
  selectedDayEvents.value = dayEvents
  showDayDialog.value = true
}

async function handleAddEvent() {
  if (!newEvent.value.title || !newEvent.value.scheduledDate)
    return
  saving.value = true
  try {
    await apiFetch('/api/calendar', {
      method: 'POST',
      body: newEvent.value,
    })
    await loadEvents()
    showAddDialog.value = false
    newEvent.value = { title: '', scheduledDate: '', platform: 'blog', notes: '' }
  }
  finally {
    saving.value = false
  }
}

async function deleteEvent(id: string) {
  await apiFetch(`/api/calendar/${id}`, { method: 'DELETE' })
  events.value = events.value.filter(e => e.id !== id)
  selectedDayEvents.value = selectedDayEvents.value.filter(e => e.id !== id)
}

const upcomingEvents = computed(() => {
  const nowMs = Date.now()
  return events.value
    .filter(e => new Date(e.scheduledDate).getTime() >= nowMs)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 7)
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Kalender
        </h1>
        <p class="text-muted-foreground">
          Jadwal konten bulan ini
        </p>
      </div>
      <Button size="sm" @click="showAddDialog = true">
        <Plus class="h-4 w-4 mr-1.5" />
        Jadwalkan
      </Button>
    </div>

    <div class="grid gap-6 lg:grid-cols-4">
      <!-- Calendar -->
      <div class="lg:col-span-3 space-y-4">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="prevMonth">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <h2 class="text-base font-semibold min-w-36 text-center">
            {{ monthNames[currentMonth - 1] }} {{ currentYear }}
          </h2>
          <Button variant="ghost" size="icon" @click="nextMonth">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <div v-if="loading">
          <Skeleton class="h-80 w-full" />
        </div>
        <CalendarGrid
          v-else
          :year="currentYear"
          :month="currentMonth"
          :events="events"
          @day-click="handleDayClick"
        />
      </div>

      <!-- Upcoming sidebar -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold">
          Akan Datang
        </h3>
        <div v-if="upcomingEvents.length === 0" class="text-sm text-muted-foreground">
          Tidak ada jadwal
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="event in upcomingEvents"
            :key="event.id"
            class="rounded-md border p-2.5 text-sm"
          >
            <p class="font-medium truncate">
              {{ event.title }}
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ formatDate(event.scheduledDate) }} · {{ event.platform ?? 'umum' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Dialog -->
    <Dialog v-model:open="showDayDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ selectedDay?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div v-if="selectedDayEvents.length === 0" class="text-sm text-muted-foreground py-4 text-center">
            Tidak ada jadwal di hari ini
          </div>
          <div
            v-for="event in selectedDayEvents"
            :key="event.id"
            class="flex items-center gap-3 rounded-md border p-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">
                {{ event.title }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ event.platform ?? 'umum' }}
              </p>
            </div>
            <Button variant="ghost" size="icon" class="h-7 w-7 text-destructive" @click="deleteEvent(event.id)">
              <X class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDayDialog = false">
            Tutup
          </Button>
          <Button @click="() => { showDayDialog = false; showAddDialog = true }">
            Tambah Jadwal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Add Event Dialog -->
    <Dialog v-model:open="showAddDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jadwalkan Konten</DialogTitle>
          <DialogDescription>Tambah konten ke kalender editorial</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="ev-title">Judul</Label>
            <Input id="ev-title" v-model="newEvent.title" placeholder="Judul konten yang akan dipublikasi" />
          </div>
          <div class="space-y-2">
            <Label for="ev-date">Tanggal & Waktu</Label>
            <Input id="ev-date" v-model="newEvent.scheduledDate" type="datetime-local" />
          </div>
          <div class="space-y-2">
            <Label>Platform</Label>
            <Select v-model="newEvent.platform">
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
            <Label for="ev-notes">Catatan (opsional)</Label>
            <Textarea id="ev-notes" v-model="newEvent.notes" placeholder="Catatan tambahan..." :rows="2" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddDialog = false">
            Batal
          </Button>
          <Button :disabled="saving || !newEvent.title || !newEvent.scheduledDate" @click="handleAddEvent">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
