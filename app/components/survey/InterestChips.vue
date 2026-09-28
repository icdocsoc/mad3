<script setup lang="ts">
import { type ChipKey, interestGroups } from '~~/hono/survey';

// 0 = not for me, 1 = into it, 2 = love it: the three levels the allocator has always used.
const model = defineModel<Record<ChipKey, 0 | 1 | 2>>({ required: true });

const LEVELS = ['', 'into it', 'love it'] as const;

function tap(key: ChipKey) {
  model.value = {
    ...model.value,
    [key]: ((model.value[key] + 1) % 3) as 0 | 1 | 2
  };
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-gray-600">
      Tap once if you're into it, twice if you love it, and again to clear it.
    </p>
    <div v-for="group in interestGroups" :key="group.label">
      <p class="mb-2 font-bold">{{ group.label }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in group.options"
          :key="option.key"
          type="button"
          :aria-pressed="model[option.key] > 0"
          :aria-label="`${option.label}${model[option.key] ? `, ${LEVELS[model[option.key]]}` : ''}`"
          class="rounded-full border-2 px-3 py-1.5 text-sm"
          :class="[
            model[option.key] == 0 && 'border-gray-300 bg-white',
            model[option.key] == 1 && 'border-primary bg-blue-50',
            model[option.key] == 2 && 'border-primary bg-primary text-white'
          ]"
          @click="tap(option.key)">
          {{ option.label }}
          <span v-if="model[option.key] == 2" aria-hidden="true">♥</span>
        </button>
      </div>
    </div>
  </div>
</template>
