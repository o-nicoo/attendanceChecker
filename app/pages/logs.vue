<script setup lang="ts">
definePageMeta({ title: 'Protokoll' })

const dateFilter = ref(new Date().toISOString().substring(0, 10))
const page = ref(0)
const limit = 30

const { data, refresh } = await useFetch('/api/logs', {
  query: computed(() => ({
    limit,
    offset: page.value * limit,
    date: dateFilter.value || undefined,
  })),
})

watch(dateFilter, () => { page.value = 0; refresh() })

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / limit))

function formatTs(ts: string) {
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="flex items-end justify-between pb-1">
      <div>
        <p class="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Verlauf</p>
        <h1 class="text-3xl font-bold text-text-primary tracking-tight">Protokoll</h1>
      </div>
      <div class="flex items-center gap-3">
        <input v-model="dateFilter" type="date" class="input w-auto" />
        <button class="btn-ghost" @click="dateFilter = ''; refresh()">Alle</button>
        <a :href="`/api/logs/export${dateFilter ? '?date=' + dateFilter : ''}`"
           download class="btn-ghost">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV Export
        </a>
      </div>
    </div>

    <!-- Count -->
    <p class="text-sm text-text-muted">
      <span class="text-text-secondary font-semibold tabular-nums">{{ data?.total ?? 0 }}</span>
      Einträge{{ dateFilter ? ` am ${new Date(dateFilter + 'T12:00:00').toLocaleDateString('de-DE')}` : ' gesamt' }}
    </p>

    <!-- Table -->
    <div class="panel">
      <table class="w-full">
        <thead>
          <tr class="border-b border-bg-border">
            <th class="th">Zeitstempel</th>
            <th class="th">Schüler</th>
            <th class="th">Klasse</th>
            <th class="th">RFID-ID</th>
            <th class="th">Ereignis</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in data?.logs" :key="log.id" class="table-row">
            <td class="px-5 py-3.5">
              <span class="text-xs font-mono text-text-muted">{{ formatTs(log.timestamp) }}</span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-sm font-medium text-text-primary">{{ log.student_name ?? '—' }}</span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-sm text-text-secondary">{{ log.student_class ?? '—' }}</span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-xs font-mono text-text-muted bg-bg-elevated border border-bg-border px-2.5 py-1 rounded-lg">
                {{ log.rfid_id }}
              </span>
            </td>
            <td class="px-5 py-3.5">
              <span :class="{
                'badge-in':   log.event_type === 'enter',
                'badge-out':  log.event_type === 'exit',
                'badge-scan': log.event_type === 'unknown',
              }">
                {{ log.event_type === 'enter' ? 'Eintritt' : log.event_type === 'exit' ? 'Austritt' : 'Scan' }}
              </span>
            </td>
          </tr>
          <tr v-if="!data?.logs?.length">
            <td colspan="5" class="px-5 py-16 text-center text-sm text-text-muted">
              Keine Einträge für diesen Zeitraum.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <span class="text-xs text-text-muted">
        Seite <span class="text-text-secondary font-semibold">{{ page + 1 }}</span> von {{ totalPages }}
      </span>
      <div class="flex gap-2">
        <button class="btn-ghost text-xs" :disabled="page === 0" @click="page--; refresh()">← Zurück</button>
        <button class="btn-ghost text-xs" :disabled="page >= totalPages - 1" @click="page++; refresh()">Weiter →</button>
      </div>
    </div>
  </div>
</template>
