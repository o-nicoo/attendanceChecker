<script setup lang="ts">
definePageMeta({ title: 'Students' })

const { data: students, refresh } = await useFetch('/api/students')

const showModal = ref(false)
const loading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  rfid_id: '',
  class: '',
})

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
  if (!confirm(`Schüler "${name}" wirklich löschen?`)) return
  await $fetch(`/api/students/${id}`, { method: 'DELETE' })
  await refresh()
}

const search = ref('')
const filtered = computed(() => {
  if (!students.value) return []
  const q = search.value.toLowerCase()
  return students.value.filter((s: any) =>
    s.name.toLowerCase().includes(q) ||
    s.rfid_id.toLowerCase().includes(q) ||
    s.class.toLowerCase().includes(q)
  )
})

const grouped = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const s of filtered.value) {
    const key = s.class || 'Ohne Klasse'
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  return groups
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-text-primary">Schüler</h1>
        <p class="text-sm text-text-secondary mt-1">{{ students?.length ?? 0 }} registrierte Schüler</p>
      </div>
      <button class="btn-primary" @click="showModal = true">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Schüler hinzufügen
      </button>
    </div>

    <!-- Search -->
    <input
      v-model="search"
      type="text"
      placeholder="Name, RFID-ID oder Klasse suchen..."
      class="input w-full max-w-sm"
    />

    <!-- Student groups -->
    <div class="space-y-6">
      <div v-for="(group, className) in grouped" :key="className">
        <div class="flex items-center gap-3 mb-3">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wider">{{ className }}</h2>
          <div class="flex-1 h-px bg-bg-border" />
          <span class="text-xs text-text-muted">{{ group.length }}</span>
        </div>

        <div class="card p-0 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-bg-border">
                <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">RFID-ID</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Zuletzt gesehen</th>
                <th class="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in group" :key="s.id" class="table-row">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center flex-shrink-0">
                      <span class="text-xs font-semibold text-text-secondary">{{ s.name.charAt(0) }}</span>
                    </div>
                    <span class="text-sm text-text-primary font-medium">{{ s.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs font-mono text-text-secondary bg-bg-elevated px-2 py-1 rounded">{{ s.rfid_id }}</span>
                </td>
                <td class="px-4 py-3">
                  <span :class="s.status === 'in' ? 'badge-in' : 'badge-out'">
                    {{ s.status === 'in' ? 'Im Raum' : 'Abwesend' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-text-secondary">
                  {{ s.last_seen ? new Date(s.last_seen).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button class="btn-danger text-xs py-1 px-2" @click="deleteStudent(s.id, s.name)">
                    Löschen
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!filtered.length" class="py-16 text-center">
        <p class="text-text-muted text-sm">Keine Schüler gefunden.</p>
      </div>
    </div>

    <!-- Add Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showModal = false" />
        <div class="relative card w-full max-w-md animate-slide-up">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-base font-semibold text-text-primary">Neuer Schüler</h2>
            <button class="text-text-muted hover:text-text-primary" @click="showModal = false">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="addStudent">
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">Name *</label>
              <input v-model="form.name" type="text" placeholder="Max Mustermann" class="input w-full" required />
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">RFID-ID *</label>
              <input v-model="form.rfid_id" type="text" placeholder="z. B. RFID-007" class="input w-full font-mono" required />
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1.5">Klasse</label>
              <input v-model="form.class" type="text" placeholder="z. B. 10A" class="input w-full" />
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
