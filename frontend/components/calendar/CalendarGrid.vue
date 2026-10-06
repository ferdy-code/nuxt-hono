<script setup lang="ts">
export interface CalendarEvent {
  id: string
  title: string
  scheduledDate: string
  platform: string | null
  status: string
  contentItemId: string | null
}

const props = defineProps<{
  year: number
  month: number
  events: CalendarEvent[]
}>()

const emit = defineEmits<{ dayClick: [date: Date, events: CalendarEvent[]] }>()

const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const calendarDays = computed(() => {
  const firstDay = new Date(props.year, props.month - 1, 1)
  const lastDay = new Date(props.year, props.month, 0)
  const startOffset = firstDay.getDay()
  const days: (Date | null)[] = []

  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(props.year, props.month - 1, d))
  }

  return days
})

function eventsForDay(date: Date): CalendarEvent[] {
  return props.events.filter((e) => {
    const d = new Date(e.scheduledDate)
    return d.getFullYear() === date.getFullYear()
      && d.getMonth() === date.getMonth()
      && d.getDate() === date.getDate()
  })
}

const today = new Date()

function isToday(date: Date) {
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

const platformColors: Record<string, string> = {
  twitter: 'bg-sky-400',
  linkedin: 'bg-blue-600',
  instagram: 'bg-pink-500',
  blog: 'bg-primary',
}
</script>

<template>
  <div>
    <div class="grid grid-cols-7 mb-2">
      <div
        v-for="day in daysOfWeek"
        :key="day"
        class="text-center text-xs font-medium text-muted-foreground py-2"
      >
        {{ day }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden border">
      <div
        v-for="(date, idx) in calendarDays"
        :key="idx"
        class="min-h-[80px] bg-background p-1.5" :class="[
          date ? 'cursor-pointer hover:bg-accent/50 transition-colors' : 'bg-muted/30',
        ]"
        @click="date && emit('dayClick', date, eventsForDay(date))"
      >
        <template v-if="date">
          <div
            class="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1" :class="[
              isToday(date) ? 'bg-primary text-primary-foreground' : 'text-foreground',
            ]"
          >
            {{ date.getDate() }}
          </div>
          <div class="space-y-0.5">
            <div
              v-for="event in eventsForDay(date).slice(0, 3)"
              :key="event.id"
              class="h-1.5 rounded-full" :class="[platformColors[event.platform ?? ''] ?? 'bg-muted-foreground']"
              :title="event.title"
            />
            <div v-if="eventsForDay(date).length > 3" class="text-[10px] text-muted-foreground pl-0.5">
              +{{ eventsForDay(date).length - 3 }} lagi
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
