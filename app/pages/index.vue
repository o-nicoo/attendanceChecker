<script setup lang="ts">
definePageMeta({ title: 'Dashboard' })

const { data: presence, refresh: refreshPresence } = await useFetch('/api/presence')
const { data: analytics } = await useFetch('/api/analytics')
const { data: logs } = await useFetch('/api/logs', { query: { limit: 8 } })

// auto-refresh presence every 10s
useIntervalFn(() => refreshPresence(), 10_000)

function formatTime(ts: string) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(ts: string) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Min.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tagen`
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-text-primary">Dashboard</h1>
      <p class="text-sm text-text-secondary mt-1">Echtzeit-Anwesenheitsübersicht</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Im Raum</p>
        <p class="text-3xl font-semibold text-accent mt-2">{{ presence?.count ?? 0 }}</p>
        <p class="text-xs text-text-secondary mt-1">von {{ presence?.total ?? 0 }} Schülern</p>
      </div>
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Eintritte heute</p>
        <p class="text-3xl font-semibold text-text-primary mt-2">{{ analytics?.stats?.entries_today ?? 0 }}</p>
        <p class="text-xs text-text-secondary mt-1">Scans</p>
      </div>
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Gesamtscans</p>
        <p class="text-3xl font-semibold text-text-primary mt-2">{{ analytics?.stats?.total_scans ?? 0 }}</p>
        <p class="text-xs text-text-secondary mt-1">aller Zeiten</p>
      </div>
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Schüler</p>
        <p class="text-3xl font-semibold text-text-primary mt-2">{{ analytics?.stats?.total_students ?? 0 }}</p>
        <p class="text-xs text-text-secondary mt-1">registriert</p>
      </div>
    </div>

    <!-- Main grid -->
    <div class="grid grid-cols-5 gap-6">
      <!-- Presence list -->
      <div class="col-span-2 card space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-text-primary">Aktuell im Raum</h2>
          <div class="flex items-center gap-1.5">
            <div class="dot-online" />
            <span class="text-xs text-text-secondary">Live</span>
          </div>
        </div>

        <div v-if="!presence?.present?.length" class="py-8 text-center">
          <div class="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-3">
            <svg class="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p class="text-sm text-text-muted">Niemand im Raum</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="p in presence.present"
            :key="p.rfid_id"
            class="flex items-center gap-3 p-2.5 rounded-lg bg-bg-elevated border border-bg-border"
          >
            <div class="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <span class="text-xs font-semibold text-accent">{{ p.name?.charAt(0) ?? '?' }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-text-primary truncate">{{ p.name ?? 'Unbekannt' }}</p>
              <p class="text-xs text-text-secondary">{{ p.class ?? '—' }} · seit {{ formatTime(p.entered_at) }}</p>
            </div>
            <span class="badge-in">drin</span>
          </div>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="col-span-3 card space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-text-primary">Letzte Aktivität</h2>
          <NuxtLink to="/logs" class="text-xs text-accent hover:underline">Alle anzeigen</NuxtLink>
        </div>

        <div class="space-y-1">
          <div
            v-for="log in logs?.logs"
            :key="log.id"
            class="table-row flex items-center gap-4 py-2.5 px-2 rounded-lg"
          >
            <div :class="log.event_type === 'enter' ? 'text-success' : 'text-danger'" class="flex-shrink-0">
              <svg v-if="log.event_type === 'enter'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-text-primary truncate">{{ log.student_name ?? log.rfid_id }}</p>
              <p class="text-xs text-text-secondary">{{ log.student_class ?? '—' }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <span :class="log.event_type === 'enter' ? 'badge-in' : 'badge-out'">
                {{ log.event_type === 'enter' ? 'Eintritt' : 'Austritt' }}
              </span>
              <p class="text-xs text-text-muted mt-1 font-mono">{{ timeAgo(log.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
