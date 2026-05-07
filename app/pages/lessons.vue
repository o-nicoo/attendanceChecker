<script setup lang="ts">
definePageMeta({ title: 'Stunden' })

const { data, refresh } = await useFetch('/api/lessons')

const showModal = ref(false)
const form = reactive({ start: '', end: '' })
const saving = ref(false)
const error = ref('')

function formatTs(ts: number) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(start: number, end: number) {
  if (!start || !end) return '—'
  const diff = end - start
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (h > 0) return `${h} Std. ${m} Min.`
  return `${m} Min.`
}

function openModal() {
  form.start = ''
  form.end = ''
  error.value = ''
  showModal.value = true
}

async function save() {
  if (!form.start || !form.end) { error.value = 'Bitte beide Felder ausfüllen.'; return }
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/lessons', {
      method: 'POST',
      body: { start: form.start, end: form.end },
    })
    showModal.value = false
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Fehler beim Speichern.'
  } finally {
    saving.value = false
  }
}

async function deleteLesson(id: number) {
  await $fetch(`/api/lessons/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="page-header flex items-end justify-between">
      <div>
        <p class="overline">Verwaltung</p>
        <h1 class="page-title">Stunden</h1>
      </div>
      <button class="btn-primary" @click="openModal">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Neue Stunde
      </button>
    </div>

    <!-- Table -->
    <div class="panel">
      <table class="w-full">
        <thead>
          <tr>
            <th class="th">Datum</th>
            <th class="th">Startzeit</th>
            <th class="th">Endzeit</th>
            <th class="th">Dauer</th>
            <th class="th">Anwesende</th>
            <th class="th w-12"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lesson in (data as any[])" :key="lesson.id" class="table-row">
            <td class="px-5 py-3.5">
              <span class="text-sm text-text-primary">
                {{ lesson.start ? new Date(lesson.start * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—' }}
              </span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-sm font-mono text-text-secondary">
                {{ lesson.start ? new Date(lesson.start * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—' }}
              </span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-sm font-mono text-text-secondary">
                {{ lesson.end ? new Date(lesson.end * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—' }}
              </span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-sm text-text-muted">{{ formatDuration(lesson.start, lesson.end) }}</span>
            </td>
            <td class="px-5 py-3.5">
              <span class="badge-in">{{ lesson.present_count }} Schüler</span>
            </td>
            <td class="px-5 py-3.5 text-right">
              <button class="btn-danger text-xs px-2 py-1" @click="deleteLesson(lesson.id)">
                Löschen
              </button>
            </td>
          </tr>
          <tr v-if="!(data as any[])?.length">
            <td colspan="6" class="px-5 py-20 text-center">
              <div class="flex flex-col items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center"
                     style="border: 1px solid rgba(255,255,255,0.06)">
                  <svg class="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-text-secondary">Keine Stunden eingetragen</p>
                  <p class="text-xs text-text-muted mt-0.5">Klicke auf „Neue Stunde" um eine Stunde anzulegen.</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);"
           @click.self="showModal = false">
        <div class="card w-full max-w-md animate-slide-up">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-base font-semibold text-text-primary">Neue Stunde</h2>
            <button class="text-text-muted hover:text-text-primary transition-colors" @click="showModal = false">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="overline mb-2 block">Startzeit</label>
              <input v-model="form.start" type="datetime-local" class="input" />
            </div>
            <div>
              <label class="overline mb-2 block">Endzeit</label>
              <input v-model="form.end" type="datetime-local" class="input" />
            </div>
            <p v-if="error" class="text-xs text-danger">{{ error }}</p>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button class="btn-ghost" @click="showModal = false">Abbrechen</button>
            <button class="btn-primary" :disabled="saving" @click="save">
              {{ saving ? 'Speichern…' : 'Stunde anlegen' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
