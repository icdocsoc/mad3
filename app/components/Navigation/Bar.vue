<script setup lang="ts">
// TODO: login must come from backend
const isLoggedIn = ref(false);
</script>

<template>
  <nav class="bg-primary flex justify-between rounded-b-2xl px-4 py-2">
    <NavigationLink to="/" icon="/images/docsoc-square-white.png">
      MaD
    </NavigationLink>
    <ul class="flex items-center gap-3">
      <li>
        <NavigationLink to="/parent">Parent</NavigationLink>
      </li>
      <li>
        <NavigationLink to="/fresher">Fresher</NavigationLink>
      </li>
    </ul>
  </nav>
</template>
