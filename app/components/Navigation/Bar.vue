<script setup lang="ts">
// TODO: login must come from backend
const isLoggedIn = ref(false);
</script>

<template>
  <nav class="bg-primary flex justify-between rounded-b-2xl px-4 py-2">
    <NuxtLink to="/" class="flex items-center gap-3">
      <img src="/images/docsoc-square-white.png" alt="logo" class="h-12 w-12" />
      <h1 class="text-2xl font-bold text-white">MaD</h1>
    </NuxtLink>
    <ul class="flex items-center gap-3">
      <li>
        <NuxtLink to="/parent" class="font-bold text-white">Parent</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/fresher" class="font-bold text-white">Fresher</NuxtLink>
      </li>
    </ul>
  </nav>
</template>
