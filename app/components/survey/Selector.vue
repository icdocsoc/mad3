<script setup lang="ts">
type Props = {
  question: SurveyQuestionType;
  label: string;
};
const props = defineProps<Props>();

type Emits = {
  change: [value: any];
};
const emit = defineEmits<Emits>();
function handleChange(value: any) {
  emit('change', value);
}
</script>

<template>
  <SurveyText
    v-if="props.question.type === 'text'"
    :question="props.question"
    @change="handleChange" />
  <SurveyMatrix
    v-else-if="props.question.type === 'matrix'"
    :question="props.question"
    @update="handleChange" />
  <SurveyTextarea
    v-else-if="props.question.type === 'textarea'"
    :question="props.question"
    @change="handleChange" />
  <SurveyArray
    v-else-if="props.question.type === 'array'"
    :label="label"
    :question="props.question"
    @change="handleChange" />
  <SurveySelect
    v-else-if="props.question.type === 'select'"
    :question="props.question"
    :label="label"
    @update="handleChange" />
</template>
