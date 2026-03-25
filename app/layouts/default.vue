<template>
  <div class="flex min-h-screen">
    <AppNav />
    <main class="flex-1 ml-60 min-h-screen">
      <div class="max-w-7xl mx-auto px-6 py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
