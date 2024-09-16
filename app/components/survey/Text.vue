<script setup lang="ts">
type Props = {
  question: {
    type: 'text';
    title: string;
    placeholder?: string;
    required?: boolean;
  };
};

const props = defineProps<Props>();
</script>

<template>
  <div>
    <input
      type="text"
      :placeholder="props.question.placeholder"
      :required="props.question.required" />
  </div>
</template>
