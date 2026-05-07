<script setup lang="ts">
const { data: students, refresh: refreshStudents } = await useFetch('/api/students')
const { data: logsData, refresh: refreshLogs } = await useFetch('/api/logs', {
  query: { limit: 20 },
})

const todayStr = new Date().toISOString().substring(0, 10)
const { data: todayData } = await useFetch('/api/logs', {
  query: { limit: 500, date: todayStr },
})

// Weekly data: last 7 days
const weekStart = new Date()
weekStart.setDate(weekStart.getDate() - 6)
const weekStartStr = weekStart.toISOString().substring(0, 10)
const { data: weekData } = await useFetch('/api/logs', {
  query: { limit: 2000 },
})

const present  = computed(() => (students.value as any[] ?? []).filter((s: any) => s.status === 'in'))
const absent   = computed(() => (students.value as any[] ?? []).filter((s: any) => s.status !== 'in'))
const todayIn  = computed(() => (todayData.value?.logs as any[] ?? []).filter((l: any) => l.event_type === 'enter').length)
const total    = computed(() => (students.value as any[] ?? []).length)

// Build weekly bar data (last 7 days)
const weekDays = computed(() => {
  const days: { label: string; date: string; count: number }[] = []
  const allLogs = weekData.value?.logs as any[] ?? []
  const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().substring(0, 10)
    const count = allLogs.filter((l: any) => {
      return l.timestamp?.substring(0, 10) === dateStr && l.event_type === 'enter'
    }).length
    days.push({ label: DAY_LABELS[d.getDay()], date: dateStr, count })
  }
  return days
})

const weekMax = computed(() => Math.max(1, ...weekDays.value.map(d => d.count)))

function initials(name: string) {
  if (!name?.trim()) return '?'
  return name.trim().split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
}

function formatTime(ts: string) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(ts: string) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `vor ${m} Min.`
  const h = Math.floor(m / 60)
  return h < 24 ? `vor ${h} Std.` : new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { refreshStudents(); refreshLogs() }, 10000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Page header -->
    <div class="page-header flex items-end justify-between">
      <div>
        <p class="overline">Übersicht</p>
        <h1 class="page-title">Dashboard</h1>
      </div>
      <div class="flex items-center gap-2 mb-1">
        <div class="dot-online" />
        <span class="text-xs text-text-muted">Aktualisiert alle 10 s</span>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

      <div class="card">
        <p class="overline">Im Raum</p>
        <p class="stat-number text-success">{{ present.length }}</p>
        <p class="text-xs text-text-muted">von {{ total }} Schülern</p>
      </div>

      <div class="card">
        <p class="overline">Abwesend</p>
        <p class="stat-number text-text-secondary">{{ absent.length }}</p>
        <p class="text-xs text-text-muted">nicht im Raum</p>
      </div>

      <div class="card">
        <p class="overline">Eintritte heute</p>
        <p class="stat-number text-text-primary">{{ todayIn }}</p>
        <p class="text-xs text-text-muted">{{ new Date().toLocaleDateString('de-DE') }}</p>
      </div>

      <div class="card">
        <p class="overline">Schüler</p>
        <p class="stat-number text-text-primary">{{ total }}</p>
        <p class="text-xs text-text-muted">registriert</p>
      </div>

    </div>

    <!-- Main panels -->
    <div class="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-5 gap-5">

      <!-- Aktuell im Raum -->
      <div class="panel lg:col-span-2 2xl:col-span-3 flex flex-col">
        <div class="flex items-center justify-between px-6 py-4" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <div class="flex items-center gap-3">
            <h2 class="text-sm font-semibold text-text-primary">Aktuell im Raum</h2>
            <span v-if="present.length"
              class="text-xs font-bold px-2 py-0.5 rounded-md bg-success/10 text-success">
              {{ present.length }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="dot-online" />
            <span class="text-xs font-semibold text-text-muted tracking-wider uppercase">Live</span>
          </div>
        </div>

        <!-- Present students -->
        <div v-if="present.length" class="flex-1">
          <div
            v-for="s in present"
            :key="s.id"
            class="flex items-center gap-4 px-6 py-4 hover:bg-bg-elevated/50 transition-colors duration-100"
            style="border-bottom: 1px solid rgba(255,255,255,0.04)"
          >
            <div class="avatar-in w-9 h-9">{{ initials(s.name) }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-text-primary truncate">{{ s.name || '—' }}</p>
              <p class="text-xs text-text-muted">{{ s.class || 'Keine Klasse' }}</p>
            </div>
            <div class="text-right flex-shrink-0 space-y-1">
              <span class="badge-in block">Im Raum</span>
              <p class="text-xs text-text-muted">seit {{ formatTime(s.entered_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="flex-1 flex flex-col items-center justify-center py-16 gap-4">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center"
               style="border: 1px solid rgba(255,255,255,0.06)">
            <svg class="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-sm font-semibold text-text-secondary">Niemand im Raum</p>
            <p class="text-xs text-text-muted mt-0.5">Warte auf RFID-Scan</p>
          </div>
        </div>

        <!-- Absent footer -->
        <div v-if="absent.length" class="px-6 py-3 bg-bg-elevated/30"
             style="border-top: 1px solid rgba(255,255,255,0.06)">
          <p class="text-xs text-text-muted leading-relaxed">
            <span class="text-text-secondary font-medium">Abwesend:</span>
            {{ absent.slice(0, 5).map((s: any) => s.name || '—').join(' · ') }}
            <span v-if="absent.length > 5" class="text-text-faint"> +{{ absent.length - 5 }}</span>
          </p>
        </div>
      </div>

      <!-- Letzte Aktivität -->
      <div class="panel lg:col-span-1 2xl:col-span-2 flex flex-col">
        <div class="flex items-center justify-between px-6 py-4"
             style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <h2 class="text-sm font-semibold text-text-primary">Letzte Aktivität</h2>
          <NuxtLink to="/logs"
            class="text-xs text-text-muted hover:text-text-secondary transition-colors duration-150 font-medium">
            Alle →
          </NuxtLink>
        </div>

        <div v-if="logsData?.logs?.length" class="flex-1">
          <div
            v-for="log in logsData.logs"
            :key="log.id"
            class="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-elevated/50 transition-colors duration-100"
            style="border-bottom: 1px solid rgba(255,255,255,0.04)"
          >
            <div :class="log.event_type === 'enter' ? 'avatar-in' : 'avatar-out'" class="w-8 h-8 text-[11px]">
              {{ initials(log.student_name ?? '') }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-text-primary truncate leading-tight">
                {{ log.student_name || log.rfid_id }}
              </p>
              <p class="text-xs text-text-muted mt-0.5">{{ timeAgo(log.timestamp) }}</p>
            </div>
            <span :class="log.event_type === 'enter' ? 'badge-in' : 'badge-out'">
              {{ log.event_type === 'enter' ? 'Eintritt' : 'Austritt' }}
            </span>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center py-12">
          <p class="text-sm text-text-muted">Noch keine Aktivität</p>
        </div>
      </div>

    </div>

    <!-- Weekly overview -->
    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <div>
          <p class="overline">Diese Woche</p>
          <h2 class="text-base font-semibold text-text-primary">Eintritte der letzten 7 Tage</h2>
        </div>
        <NuxtLink to="/analytics" class="text-xs text-text-muted hover:text-text-secondary transition-colors font-medium">
          Auswertung →
        </NuxtLink>
      </div>
      <div class="flex items-end gap-2 h-28">
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="flex-1 flex flex-col items-center gap-2"
        >
          <span class="text-xs font-mono text-text-muted tabular-nums">{{ day.count || '' }}</span>
          <div class="w-full rounded-lg transition-all duration-300 relative"
               :style="{
                 height: day.count > 0 ? `${Math.max(8, (day.count / weekMax) * 72)}px` : '4px',
                 background: day.date === todayStr
                   ? 'rgba(48, 209, 88, 0.7)'
                   : day.count > 0
                     ? 'rgba(255,255,255,0.15)'
                     : 'rgba(255,255,255,0.04)',
               }"
          />
          <span class="text-xs font-medium"
                :class="day.date === todayStr ? 'text-success' : 'text-text-muted'">
            {{ day.label }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>
