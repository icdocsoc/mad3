<script setup lang="ts">
type Props = { questions: SurveyQuestions };
const props = defineProps<Props>();

type Emits = { submit: [answers: Record<keyof Props['questions'], any>] };
const emit = defineEmits<Emits>();

function handleSubmit() {
  emit('submit', {});
}
</script>

<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <div v-for="(question, label) in props.questions" :key="name">
        <SurveyText v-if="question.type === 'text'" :question="question" />
        <SurveyMatrix
          v-else-if="question.type === 'matrix'"
          :question="question" />
        <SurveyTextarea
          v-else-if="question.type === 'textarea'"
          :question="question" />
        <SurveyArray
          v-else-if="question.type === 'array'"
          :question="question" />
        <SurveySelect
          v-else-if="question.type === 'select'"
          :question="question" />
      </div>
    </form>
  </div>
</template>
