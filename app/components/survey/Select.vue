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
</script>

<template>
  <div>
    <h3 class="inline">{{ props.question.title }}</h3>
    <div class="flex flex-wrap gap-4">
      <div
        v-for="(value, key) in props.question.options"
        :key="key"
        class="flex items-center gap-2">
        <input :name="props.label" type="radio" :value="value" />
        <span>{{ value }}</span>
      </div>
    </div>
  </div>
</template>
