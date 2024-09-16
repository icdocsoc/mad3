<script setup lang="ts">
type Props = {
  question: SurveyQuestionType;
  label: string;
};

const props = defineProps<Props>();
</script>

<template>
  <SurveyText v-if="question.type === 'text'" :question="question" />
  <SurveyMatrix v-else-if="question.type === 'matrix'" :question="question" />
  <SurveyTextarea
    v-else-if="question.type === 'textarea'"
    :question="question" />
  <SurveyArray v-else-if="question.type === 'array'" :question="question" />
  <SurveySelect
    v-else-if="question.type === 'select'"
    :question="question"
    :label="label" />
</template>
