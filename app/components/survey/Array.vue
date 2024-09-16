<script setup lang="ts">
type Props = {
  question: {
    type: 'array';
    title: string;
    schema: SurveyQuestionType;
    required?: boolean;
  };
  label: string;
};
const props = defineProps<Props>();

const answers = ref<Record<number, any>>({});
function handleChange(index: number, value: any) {
  answers.value = { ...answers.value, [index]: value };
}
type Emits = {
  change: [value: any[]];
};
const emit = defineEmits<Emits>();
watch(answers, () => {
  emit('change', Object.values(answers.value));
});

const arrayCount = ref(1);
</script>

<template>
  <div>
    <h3>
      {{ props.question.title }}
      <span class="text-red-600" v-if="props.question.required">*</span>
    </h3>
    <div class="flex flex-col gap-2">
      <SurveySelector
        v-for="i in arrayCount"
        :key="i"
        :question="props.question.schema"
        :label="label"
        @change="(o: any) => handleChange(i, o)" />
    </div>
    <button
      class="mt-2 border bg-primary px-3 py-1 text-white"
      @click.prevent="arrayCount++">
      Add more
    </button>
  </div>
</template>
