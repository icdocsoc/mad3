<script setup lang="ts">
type Props = {
  question: {
    type: 'array';
    title: string;
    schema: SurveyQuestionType;
    required?: boolean;
  };
};

const props = defineProps<Props>();
</script>

<template>
  <div>Array type</div>
</template>
