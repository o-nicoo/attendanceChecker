<script setup lang="ts">
import {
  Chart,
  LineController, BarController,
  LineElement, BarElement, PointElement,
  LinearScale, CategoryScale,
  Tooltip, Legend, Filler,
} from 'chart.js'

definePageMeta({ title: 'Analytics' })

Chart.register(
  LineController, BarController,
  LineElement, BarElement, PointElement,
  LinearScale, CategoryScale,
  Tooltip, Legend, Filler,
)

const { data } = await useFetch('/api/analytics')

// Daily attendance chart
const dailyCanvas = ref<HTMLCanvasElement>()
const hourlyCanvas = ref<HTMLCanvasElement>()
let dailyChart: Chart | null = null
let hourlyChart: Chart | null = null

const ACCENT = '#00d4aa'
const DANGER = '#ff4757'
const GRID   = '#242424'
const TEXT   = '#888888'

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1c1c1c',
      borderColor: '#242424',
      borderWidth: 1,
      titleColor: '#f0f0f0',
      bodyColor: '#888888',
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { color: GRID },
      ticks: { color: TEXT, font: { size: 11 } },
    },
    y: {
      grid: { color: GRID },
      ticks: { color: TEXT, font: { size: 11 } },
      beginAtZero: true,
    },
  },
}

onMounted(() => {
  if (!data.value) return

  // Daily attendance
  if (dailyCanvas.value) {
    const labels = data.value.dailyAttendance.map((d: any) => {
      const [y, m, day] = d.date.split('-')
      return `${day}.${m}`
    })
    dailyChart = new Chart(dailyCanvas.value, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Eintritte',
            data: data.value.dailyAttendance.map((d: any) => d.entries),
            borderColor: ACCENT,
            backgroundColor: `${ACCENT}15`,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: ACCENT,
            pointRadius: 4,
          },
          {
            label: 'Austritte',
            data: data.value.dailyAttendance.map((d: any) => d.exits),
            borderColor: DANGER,
            backgroundColor: `${DANGER}10`,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: DANGER,
            pointRadius: 4,
          },
        ],
      },
      options: {
        ...chartDefaults,
        plugins: {
          ...chartDefaults.plugins,
          legend: { display: true, labels: { color: TEXT, boxWidth: 12, font: { size: 11 } } },
        },
      } as any,
    })
  }

  // Hourly distribution
  if (hourlyCanvas.value) {
    const allHours = Array.from({ length: 24 }, (_, i) => i)
    const hourMap = new Map(data.value.hourlyDistribution.map((d: any) => [d.hour, d.count]))
    hourlyChart = new Chart(hourlyCanvas.value, {
      type: 'bar',
      data: {
        labels: allHours.map(h => `${h.toString().padStart(2, '0')}:00`),
        datasets: [{
          label: 'Eintritte',
          data: allHours.map(h => hourMap.get(h) || 0),
          backgroundColor: `${ACCENT}40`,
          borderColor: ACCENT,
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: chartDefaults as any,
    })
  }
})

onUnmounted(() => {
  dailyChart?.destroy()
  hourlyChart?.destroy()
})
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-text-primary">Auswertung</h1>
      <p class="text-sm text-text-secondary mt-1">Anwesenheitsstatistiken & Trends</p>
    </div>

    <!-- Stat row -->
    <div class="grid grid-cols-4 gap-4">
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Schüler gesamt</p>
        <p class="text-3xl font-semibold text-text-primary mt-2">{{ data?.stats?.total_students ?? 0 }}</p>
      </div>
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Jetzt anwesend</p>
        <p class="text-3xl font-semibold text-accent mt-2">{{ data?.stats?.currently_present ?? 0 }}</p>
      </div>
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Eintritte heute</p>
        <p class="text-3xl font-semibold text-text-primary mt-2">{{ data?.stats?.entries_today ?? 0 }}</p>
      </div>
      <div class="card">
        <p class="text-xs text-text-secondary uppercase tracking-wider">Scans gesamt</p>
        <p class="text-3xl font-semibold text-text-primary mt-2">{{ data?.stats?.total_scans ?? 0 }}</p>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-2 gap-6">
      <div class="card space-y-4">
        <h2 class="text-sm font-semibold text-text-primary">Anwesenheit (14 Tage)</h2>
        <div class="h-56">
          <canvas ref="dailyCanvas" />
        </div>
      </div>
      <div class="card space-y-4">
        <h2 class="text-sm font-semibold text-text-primary">Tageszeit-Verteilung</h2>
        <div class="h-56">
          <canvas ref="hourlyCanvas" />
        </div>
      </div>
    </div>

    <!-- Per student table -->
    <div class="card space-y-4">
      <h2 class="text-sm font-semibold text-text-primary">Schüler-Übersicht</h2>
      <div class="overflow-hidden rounded-lg border border-bg-border">
        <table class="w-full">
          <thead>
            <tr class="border-b border-bg-border bg-bg-elevated">
              <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Klasse</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Eintritte gesamt</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Zuletzt gesehen</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Anwesenheitsrate</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(s, i) in data?.perStudent"
              :key="i"
              class="table-row"
            >
              <td class="px-4 py-3 text-sm text-text-primary font-medium">{{ s.name }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ s.class }}</td>
              <td class="px-4 py-3 text-sm text-text-primary font-mono">{{ s.total_entries }}</td>
              <td class="px-4 py-3 text-xs text-text-secondary">
                {{ s.last_seen ? new Date(s.last_seen).toLocaleDateString('de-DE') : '—' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-bg-border rounded-full overflow-hidden">
                    <div
                      class="h-full bg-accent rounded-full transition-all"
                      :style="{
                        width: `${Math.min(100, (s.total_entries / Math.max(...(data?.perStudent?.map((x: any) => x.total_entries) ?? [1]))) * 100)}%`
                      }"
                    />
                  </div>
                  <span class="text-xs text-text-muted w-8 text-right font-mono">{{ s.total_entries }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
