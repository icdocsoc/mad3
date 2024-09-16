<script setup lang="ts">
type Props = {
  question: {
    type: 'matrix';
    title: string;
    rows: Record<string, string>;
    columns: Record<string, number>;
    required?: boolean;
  };
};

const props = defineProps<Props>();
</script>

<template>
  <div>MAtrix question</div>
</template>
