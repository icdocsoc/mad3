<script setup lang="ts">
import type { Option } from '~~/hono/survey/survey';

defineProps<{ groups: { label: string; options: Option[] }[] }>();
const model = defineModel<string[]>({ required: true });

function toggle(value: string) {
  model.value = model.value.includes(value)
    ? model.value.filter(chip => chip != value)
    : [...model.value, value];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-for="group in groups" :key="group.label">
      <p class="mb-2 font-bold">{{ group.label }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in group.options"
          :key="option.value"
          type="button"
          :aria-pressed="model.includes(option.value)"
          class="rounded-full border-2 px-3 py-1.5 text-sm"
          :class="
            model.includes(option.value)
              ? 'border-primary bg-primary text-white'
              : 'border-gray-300 bg-white'
          "
          @click="toggle(option.value)">
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>
