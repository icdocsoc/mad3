<script setup lang="ts">
type Props = {
  to: string;
  icon?: string; // Must be in public/
};

const props = defineProps<Props>();
</script>

<template>
  <NuxtLink :to="props.to" class="flex items-center gap-3">
    <img v-if="props.icon" :src="props.icon" alt="icon" class="h-12 w-12" />
    <h1 class="font-bold text-white"><slot></slot></h1>
  </NuxtLink>
</template>
