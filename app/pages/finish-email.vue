<script setup lang="ts">
// Sign-in links in old emails land here. They no longer work; send people to a code instead.
definePageMeta({
  middleware: () => navigateTo('/login?from=link')
});
</script>

<template>
  <div />
</template>
