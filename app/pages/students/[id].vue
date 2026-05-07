<script setup lang="ts">
definePageMeta({ title: 'Schüler Detail' })

const route = useRoute()
const id = route.params.id as string

const { data, error } = await useFetch(`/api/students/${id}`)

function formatTs(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Build heatmap: 13 weeks × 7 days (91 days, newest at bottom-right)
const heatmapGrid = computed(() => {
  const heatmapData = (data.value as any)?.heatmap as { date: string; was_present: number }[] ?? []
  const presenceMap = new Map(heatmapData.map(h => [h.date, h.was_present]))

  // Start from 13 weeks ago (Monday of that week)
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sun
  // Align to Monday
  const daysFromMonday = (dayOfWeek + 6) % 7
  const gridEnd = new Date(today)
  gridEnd.setDate(gridEnd.getDate() - daysFromMonday + 6) // end on Sunday

  // Build 91 cells: 13 cols (weeks) × 7 rows (Mon-Sun)
  const cells: { date: string; status: 'present' | 'absent' | 'future' | 'nodata' }[][] = []

  for (let week = 12; week >= 0; week--) {
    const col: typeof cells[0] = []
    for (let day = 0; day < 7; day++) {
      const d = new Date(gridEnd)
      d.setDate(d.getDate() - week * 7 - (6 - day))
      const dateStr = d.toISOString().substring(0, 10)
      const isFuture = d > today
      let status: 'present' | 'absent' | 'future' | 'nodata'
      if (isFuture) {
        status = 'future'
      } else if (presenceMap.has(dateStr)) {
        status = presenceMap.get(dateStr) === 1 ? 'present' : 'absent'
      } else {
        status = 'nodata'
      }
      col.push({ date: dateStr, status })
    }
    cells.push(col)
  }

  return cells
})

// Month labels (one per column group)
const monthLabels = computed(() => {
  return heatmapGrid.value.map((col, i) => {
    const firstCell = col[0]
    if (!firstCell) return ''
    const d = new Date(firstCell.date)
    // Show label only when month changes
    if (i === 0) return d.toLocaleDateString('de-DE', { month: 'short' })
    const prev = heatmapGrid.value[i - 1]?.[0]
    if (!prev) return ''
    const prevMonth = new Date(prev.date).getMonth()
    return d.getMonth() !== prevMonth ? d.toLocaleDateString('de-DE', { month: 'short' }) : ''
  })
})

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function cellColor(status: string) {
  if (status === 'present') return 'bg-success/70'
  if (status === 'absent') return 'bg-bg-elevated'
  if (status === 'future') return 'bg-bg-card'
  return 'bg-bg-card'
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Back link -->
    <NuxtLink to="/students"
      class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Alle Schüler
    </NuxtLink>

    <!-- Error state -->
    <div v-if="error" class="card text-center py-12">
      <p class="text-danger text-sm">Schüler nicht gefunden.</p>
    </div>

    <template v-else-if="data">

      <!-- Header -->
      <div class="page-header flex items-end justify-between">
        <div>
          <p class="overline">Schülerprofil</p>
          <h1 class="page-title">{{ (data as any).student?.name }}</h1>
        </div>
        <div class="flex items-center gap-2 mb-1">
          <span class="badge bg-bg-elevated text-text-secondary"
                style="border: 1px solid rgba(255,255,255,0.08)">
            {{ (data as any).student?.klasse || 'Keine Klasse' }}
          </span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card">
          <p class="overline">Gesamt-Eintritte</p>
          <p class="stat-number text-text-primary">{{ (data as any).stats?.total_entries ?? 0 }}</p>
          <p class="text-xs text-text-muted">Eintritte erfasst</p>
        </div>
        <div class="card">
          <p class="overline">Tage anwesend</p>
          <p class="stat-number text-success">{{ (data as any).stats?.days_present ?? 0 }}</p>
          <p class="text-xs text-text-muted">Tage mit Eintrag</p>
        </div>
        <div class="card">
          <p class="overline">Letzter Scan</p>
          <p class="text-lg font-semibold text-text-primary mt-2 leading-snug">
            {{ formatTs((data as any).stats?.last_seen) }}
          </p>
        </div>
        <div class="card">
          <p class="overline">Erster Scan</p>
          <p class="text-lg font-semibold text-text-primary mt-2 leading-snug">
            {{ formatTs((data as any).stats?.first_seen) }}
          </p>
        </div>
      </div>

      <!-- Attendance heatmap -->
      <div class="card">
        <h2 class="text-sm font-semibold text-text-primary mb-4">Anwesenheits-Heatmap (letzte 13 Wochen)</h2>
        <div class="overflow-x-auto">
          <div class="flex gap-1.5 min-w-max">
            <!-- Day labels -->
            <div class="flex flex-col gap-1 pt-5">
              <div v-for="label in DAY_LABELS" :key="label"
                   class="h-3 flex items-center text-[10px] text-text-muted w-5 leading-none">
                {{ label }}
              </div>
            </div>
            <!-- Columns (weeks) -->
            <div v-for="(col, wi) in heatmapGrid" :key="wi" class="flex flex-col gap-1">
              <!-- Month label -->
              <div class="h-4 flex items-center text-[10px] text-text-muted leading-none whitespace-nowrap">
                {{ monthLabels[wi] }}
              </div>
              <!-- Day cells -->
              <div v-for="cell in col" :key="cell.date"
                   :class="cellColor(cell.status)"
                   class="w-3 h-3 rounded-sm"
                   :title="cell.date"
              />
            </div>
          </div>
          <!-- Legend -->
          <div class="flex items-center gap-3 mt-4">
            <span class="text-xs text-text-muted">Weniger</span>
            <div class="w-3 h-3 rounded-sm bg-bg-card" style="border: 1px solid rgba(255,255,255,0.04)" />
            <div class="w-3 h-3 rounded-sm bg-bg-elevated" />
            <div class="w-3 h-3 rounded-sm bg-success/70" />
            <span class="text-xs text-text-muted">Mehr</span>
          </div>
        </div>
      </div>

      <!-- Recent logs -->
      <div class="panel">
        <div class="px-6 py-4" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <h2 class="text-sm font-semibold text-text-primary">Letzte Aktivität</h2>
        </div>
        <table class="w-full">
          <thead>
            <tr>
              <th class="th">Zeitstempel</th>
              <th class="th">Ereignis</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in (data as any).logs" :key="log.id" class="table-row">
              <td class="px-5 py-3.5">
                <span class="text-xs font-mono text-text-muted">{{ formatTs(log.time) }}</span>
              </td>
              <td class="px-5 py-3.5">
                <span :class="log.event_type === 'enter' ? 'badge-in' : 'badge-out'">
                  {{ log.event_type === 'enter' ? 'Eintritt' : 'Austritt' }}
                </span>
              </td>
            </tr>
            <tr v-if="!(data as any).logs?.length">
              <td colspan="2" class="px-5 py-12 text-center text-sm text-text-muted">
                Keine Aktivität vorhanden.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>
  </div>
</template>
