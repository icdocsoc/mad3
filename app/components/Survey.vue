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
      {{ props.questions }}
    </form>
  </div>
</template>
