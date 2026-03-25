<script setup lang="ts">
definePageMeta({ title: 'Logs' })

const dateFilter = ref(new Date().toISOString().substring(0, 10))
const page = ref(0)
const limit = 25

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
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-text-primary">Protokoll</h1>
        <p class="text-sm text-text-secondary mt-1">{{ data?.total ?? 0 }} Einträge</p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="dateFilter"
          type="date"
          class="input text-sm"
        />
        <button class="btn-ghost text-xs" @click="dateFilter = ''; refresh()">Alle</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-bg-border">
            <th class="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Zeitstempel</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Schüler</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Klasse</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">RFID-ID</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Ereignis</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in data?.logs" :key="log.id" class="table-row">
            <td class="px-5 py-3 text-xs font-mono text-text-secondary whitespace-nowrap">
              {{ formatTs(log.timestamp) }}
            </td>
            <td class="px-5 py-3">
              <span class="text-sm text-text-primary">{{ log.student_name ?? '—' }}</span>
            </td>
            <td class="px-5 py-3">
              <span class="text-sm text-text-secondary">{{ log.student_class ?? '—' }}</span>
            </td>
            <td class="px-5 py-3">
              <span class="text-xs font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded">{{ log.rfid_id }}</span>
            </td>
            <td class="px-5 py-3">
              <span
                :class="{
                  'badge-in': log.event_type === 'enter',
                  'badge-out': log.event_type === 'exit',
                  'badge-scan': log.event_type === 'unknown',
                }"
              >
                <span
                  :class="{
                    'w-1 h-1 rounded-full bg-success': log.event_type === 'enter',
                    'w-1 h-1 rounded-full bg-text-secondary': log.event_type === 'exit',
                    'w-1 h-1 rounded-full bg-accent': log.event_type === 'unknown',
                  }"
                  class="inline-block"
                />
                {{ log.event_type === 'enter' ? 'Eintritt' : log.event_type === 'exit' ? 'Austritt' : 'Scan' }}
              </span>
            </td>
          </tr>
          <tr v-if="!data?.logs?.length">
            <td colspan="5" class="px-5 py-12 text-center text-sm text-text-muted">
              Keine Einträge gefunden.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between text-sm">
      <span class="text-text-muted text-xs">
        Seite {{ page + 1 }} von {{ totalPages }}
      </span>
      <div class="flex gap-2">
        <button
          class="btn-ghost text-xs py-1.5"
          :disabled="page === 0"
          @click="page--; refresh()"
        >
          Zurück
        </button>
        <button
          class="btn-ghost text-xs py-1.5"
          :disabled="page >= totalPages - 1"
          @click="page++; refresh()"
        >
          Weiter
        </button>
      </div>
    </div>
  </div>
</template>
