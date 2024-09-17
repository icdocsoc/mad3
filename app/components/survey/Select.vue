<script setup lang="ts">
type Props = {
  options: string[];
  labels: string[];
  name: string;
  required?: boolean;
};
const { options, labels, name, required = false } = defineProps<Props>();

const model = defineModel<string>();
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-4">
      <div
        v-for="(value, index) in options"
        :key="index"
        class="flex items-center gap-2">
        <input
          :name="name"
          type="radio"
          :value="value"
          v-model="model"
          :required="required" />
        <span>{{ labels[index] }}</span>
      </div>
    </div>
  </div>
</template>
