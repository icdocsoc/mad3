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
    <h3>{{ props.question.title }}</h3>
    <textarea
      class="inline-block w-full"
      type="text"
      :required="props.question.required" />
  </div>
</template>
