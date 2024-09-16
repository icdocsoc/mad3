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

type Emits = {
  change: [value: string];
};
const emit = defineEmits<Emits>();
const inputValue = ref('');
watch(inputValue, () => emit('change', inputValue.value));
</script>

<template>
  <div>
    <h3>
      {{ props.question.title }}
      <span class="text-red-600" v-if="props.question.required">*</span>
    </h3>
    <input
      class="inline-block w-full"
      type="text"
      :placeholder="props.question.placeholder"
      v-model="inputValue"
      :required="props.question.required" />
  </div>
</template>
