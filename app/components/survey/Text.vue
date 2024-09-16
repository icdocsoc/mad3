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
    <h3>{{ props.question.title }}</h3>
    <input
      class="inline-block w-full"
      type="text"
      :placeholder="props.question.placeholder"
      :required="props.question.required" />
  </div>
</template>
