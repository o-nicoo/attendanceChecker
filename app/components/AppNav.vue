<script setup lang="ts">
const route = useRoute()

const nav = [
  { label: 'Dashboard', to: '/', icon: 'grid' },
  { label: 'Students', to: '/students', icon: 'users' },
  { label: 'Logs', to: '/logs', icon: 'list' },
  { label: 'Analytics', to: '/analytics', icon: 'chart' },
]

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed left-0 top-0 h-screen w-60 bg-bg-card border-r border-bg-border flex flex-col z-50">
    <!-- Logo -->
    <div class="px-5 py-6 border-b border-bg-border">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center glow-sm">
          <svg class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-text-primary leading-none">AttendanceChecker</p>
          <p class="text-xs text-text-secondary mt-0.5">RFID Tracking</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex-1 px-3 py-4 space-y-1">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive(item.to)
            ? 'bg-accent/10 text-accent border border-accent/20 glow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
        ]"
      >
        <!-- Grid icon -->
        <svg v-if="item.icon === 'grid'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <!-- Users icon -->
        <svg v-else-if="item.icon === 'users'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <!-- List icon -->
        <svg v-else-if="item.icon === 'list'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <!-- Chart icon -->
        <svg v-else-if="item.icon === 'chart'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {{ item.label }}
      </NuxtLink>
    </div>

    <!-- Footer -->
    <div class="px-5 py-4 border-t border-bg-border">
      <div class="flex items-center gap-2">
        <div class="dot-online" />
        <span class="text-xs text-text-secondary">System online</span>
      </div>
      <p class="text-xs text-text-muted mt-1 font-mono">Raspberry Pi connected</p>
    </div>
  </nav>
</template>
