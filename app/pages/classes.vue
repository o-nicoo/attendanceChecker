<script setup lang="ts">
definePageMeta({ title: 'Klassen' })

const { data } = await useFetch('/api/classes')

const classes = computed(() => (data.value as any)?.classes ?? [])
const students = computed(() => (data.value as any)?.students ?? [])

function studentsForClass(cls: string) {
  return students.value.filter((s: any) => s.class === cls)
}

function initials(name: string) {
  if (!name?.trim()) return '?'
  return name.trim().split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="page-header">
      <p class="overline">Übersicht</p>
      <h1 class="page-title">Klassen</h1>
    </div>

    <!-- Empty state -->
    <div v-if="!classes.length" class="card text-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center"
             style="border: 1px solid rgba(255,255,255,0.06)">
          <svg class="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-text-secondary">Keine Klassen vorhanden</p>
          <p class="text-xs text-text-muted mt-0.5">Füge Schüler mit Klassenbezeichnung hinzu.</p>
        </div>
      </div>
    </div>

    <!-- Classes grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="cls in classes"
        :key="cls.class"
        class="panel flex flex-col"
      >
        <!-- Card header -->
        <div class="px-6 py-5" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="overline">Klasse</p>
              <h2 class="text-2xl font-bold text-text-primary tracking-tight">{{ cls.class }}</h2>
            </div>
            <div class="text-right">
              <p class="text-xs text-text-muted">Jetzt anwesend</p>
              <p class="text-xl font-bold text-success tabular-nums">
                {{ cls.present_now }} <span class="text-text-muted text-sm font-normal">/ {{ cls.total_students }}</span>
              </p>
            </div>
          </div>

          <!-- 30-day attendance bar -->
          <div class="space-y-1.5">
            <div class="flex justify-between">
              <span class="text-xs text-text-muted">30-Tage Anwesenheit</span>
              <span class="text-xs font-semibold text-text-secondary tabular-nums">
                {{ cls.attendance_rate_30d ?? 0 }}%
              </span>
            </div>
            <div class="h-1 rounded-full bg-bg-elevated overflow-hidden">
              <div
                class="h-full rounded-full bg-accent transition-all duration-500"
                :style="{ width: `${Math.min(100, cls.attendance_rate_30d ?? 0)}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Student list -->
        <div class="flex-1">
          <div
            v-for="student in studentsForClass(cls.class)"
            :key="student.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-bg-elevated/50 transition-colors"
            style="border-bottom: 1px solid rgba(255,255,255,0.04)"
          >
            <div
              :class="student.status === 'in' ? 'avatar-in' : 'avatar-out'"
              class="w-8 h-8 text-[10px]"
            >
              {{ initials(student.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="`/students/${student.id}`"
                class="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate block"
              >
                {{ student.name }}
              </NuxtLink>
            </div>
            <div :class="student.status === 'in' ? 'dot-online' : 'dot-offline'" />
          </div>

          <div v-if="!studentsForClass(cls.class).length"
               class="px-5 py-6 text-center text-sm text-text-muted">
            Keine Schüler
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
