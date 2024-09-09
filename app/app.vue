<script setup lang="ts">
  const { data } = useFetch('/api/')
</script>

<template>
  <div>
    {{ data }}
  </div>
</template>
