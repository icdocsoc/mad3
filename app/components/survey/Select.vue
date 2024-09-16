<script setup lang="ts">
type Props = {
  question: {
    type: 'select';
    title: string;
    options: Record<string, string>;
    required?: boolean;
  };
  label: string;
};
const props = defineProps<Props>();

type Emits = {
  update: [obj: string];
};
const emit = defineEmits<Emits>();
const selected = ref('');
watch(selected, () => emit('update', selected.value));
</script>

<template>
  <div>
    <h3 class="inline">
      {{ props.question.title }}
      <span class="text-red-600" v-if="props.question.required">*</span>
    </h3>
    <div class="flex flex-wrap gap-4">
      <div
        v-for="(value, key) in props.question.options"
        :key="key"
        class="flex items-center gap-2">
        <input
          :name="props.label"
          type="radio"
          :value="value"
          v-model="selected"
          :required="props.question.required" />
        <span>{{ value }}</span>
      </div>
    </div>
  </div>
</template>
