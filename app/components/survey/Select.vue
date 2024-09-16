<script setup lang="ts">
type Props = {
  question: {
    type: 'select';
    title: string;
    options: Record<string, string>;
    required?: boolean;
  };
};

const props = defineProps<Props>();
</script>

<template>
  <div>
    <select type="text" :required="props.question.required">
      <option>Hii</option>
    </select>
  </div>
</template>
