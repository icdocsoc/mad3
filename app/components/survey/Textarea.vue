<script setup lang="ts">
type Props = {
  question: {
    type: 'textarea';
    title: string;
    required?: boolean;
  };
};

const props = defineProps<Props>();
</script>

<template>
  <div>
    <textarea type="text" :required="props.question.required" />
  </div>
</template>
