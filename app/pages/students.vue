<script setup lang="ts">
definePageMeta({ title: 'Schüler' })

const { data: students, refresh } = await useFetch('/api/students')

const showModal = ref(false)
const loading = ref(false)
const error = ref('')

const form = reactive({ name: '', rfid_id: '', class: '' })

async function addStudent() {
  if (!form.name || !form.rfid_id) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/students', {
      method: 'POST',
      body: { name: form.name, rfid_id: form.rfid_id, class: form.class },
    })
    await refresh()
    showModal.value = false
    form.name = ''
    form.rfid_id = ''
    form.class = ''
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Fehler beim Hinzufügen'
  } finally {
    loading.value = false
  }
}

async function deleteStudent(id: number, name: string) {
  if (!confirm(`Schüler „${name}" wirklich löschen?`)) return
  await $fetch(`/api/students/${id}`, { method: 'DELETE' })
  await refresh()
}

const search = ref('')
const filtered = computed(() => {
  if (!students.value) return []
  const q = search.value.toLowerCase()
  return (students.value as any[]).filter((s: any) =>
    (s.name ?? '').toLowerCase().includes(q) ||
    (s.rfid_id ?? '').toLowerCase().includes(q) ||
    (s.class ?? '').toLowerCase().includes(q),
  )
})

const grouped = computed(() => {
  const g: Record<string, any[]> = {}
  for (const s of filtered.value) {
    const k = s.class || 'Ohne Klasse'
    if (!g[k]) g[k] = []
    g[k].push(s)
  }
  return g
})

function initials(name: string) {
  if (!name?.trim()) return '?'
  return name.trim().split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="flex items-end justify-between pb-1">
      <div>
        <p class="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Verwaltung</p>
        <h1 class="text-3xl font-bold text-text-primary tracking-tight">Schüler</h1>
      </div>
      <button class="btn-primary" @click="showModal = true">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Schüler hinzufügen
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-sm">
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Name, RFID-ID oder Klasse…"
        class="input pl-10"
      />
    </div>

    <!-- Groups -->
    <div class="space-y-8">
      <div v-for="(group, className) in grouped" :key="className">

        <div class="flex items-center gap-4 mb-3">
          <span class="text-xs font-bold text-text-muted uppercase tracking-widest">{{ className }}</span>
          <div class="flex-1 h-px bg-bg-border" />
          <span class="text-xs text-text-faint font-medium">{{ group.length }}</span>
        </div>

        <div class="panel">
          <table class="w-full">
            <thead>
              <tr class="border-b border-bg-border">
                <th class="th">Name</th>
                <th class="th">RFID-ID</th>
                <th class="th">Status</th>
                <th class="th">Zuletzt gesehen</th>
                <th class="th w-px" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in group" :key="s.id" class="table-row">
                <td class="px-5 py-4">
                  <NuxtLink :to="`/students/${s.id}`" class="flex items-center gap-3 group">
                    <div :class="s.status === 'in' ? 'avatar-in' : 'avatar-out'" class="w-9 h-9">
                      {{ initials(s.name) }}
                    </div>
                    <span class="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{{ s.name || '—' }}</span>
                  </NuxtLink>
                </td>
                <td class="px-5 py-4">
                  <span class="text-xs font-mono text-text-muted bg-bg-elevated border border-bg-border px-2.5 py-1 rounded-lg">
                    {{ s.rfid_id }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span :class="s.status === 'in' ? 'badge-in' : 'badge-out'">
                    {{ s.status === 'in' ? 'Im Raum' : 'Abwesend' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-xs text-text-muted">
                  {{ s.last_seen
                    ? new Date(s.last_seen).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '—' }}
                </td>
                <td class="px-5 py-4">
                  <button class="btn-danger text-xs py-1.5 px-3" @click="deleteStudent(s.id, s.name)">
                    Löschen
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!filtered.length" class="flex flex-col items-center justify-center py-24 gap-4">
        <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-bg-border flex items-center justify-center">
          <svg class="w-6 h-6 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p class="text-sm text-text-muted">Keine Schüler gefunden.</p>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm" @click="showModal = false" />
        <div class="relative panel p-6 w-full max-w-md animate-slide-up card-glow">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-base font-bold text-text-primary">Neuer Schüler</h2>
            <button class="text-text-muted hover:text-text-primary transition-colors" @click="showModal = false">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form class="space-y-4" @submit.prevent="addStudent">
            <div>
              <label class="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Name *</label>
              <input v-model="form.name" type="text" placeholder="Max Mustermann" class="input" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">RFID-ID *</label>
              <input v-model="form.rfid_id" type="text" placeholder="z. B. 1234567890" class="input font-mono" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Klasse</label>
              <input v-model="form.class" type="text" placeholder="z. B. W245" class="input" />
            </div>
            <p v-if="error" class="text-xs text-danger">{{ error }}</p>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn-primary flex-1" :disabled="loading">
                {{ loading ? 'Wird gespeichert…' : 'Hinzufügen' }}
              </button>
              <button type="button" class="btn-ghost flex-1" @click="showModal = false">Abbrechen</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
