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
  <div>
    {{ props.question.title }}
    <SurveySelector :question="props.question.schema" />
    <button class="mt-2 rounded-2xl border bg-primary px-3 py-1 text-white">
      Add more
    </button>
  </div>
</template>
