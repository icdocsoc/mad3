<script setup lang="ts">
import type { Option } from '~~/hono/survey/survey';

const props = defineProps<{ name: string; options: Option[] }>();

// The answer is the picked option's value, or for a free option (like "I am...") the words
// typed, which is how the survey stores it.
const model = defineModel<string | undefined>({ required: true });

const freeOption = props.options.find(option => option.free);
const isOption = (value?: string) =>
  props.options.some(option => option.value == value && !option.free);

const picked = ref(
  isOption(model.value)
    ? model.value
    : model.value && freeOption
      ? freeOption.value
      : undefined
);
const typed = ref(isOption(model.value) ? '' : (model.value ?? ''));

watch([picked, typed], () => {
  model.value =
    freeOption && picked.value == freeOption.value ? typed.value : picked.value;
});
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <label
      v-for="option in props.options"
      :key="option.value"
      class="flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-blue-50">
      <input
        v-model="picked"
        type="radio"
        :name="props.name"
        :value="option.value"
        class="text-primary" />
      <span>{{ option.label }}</span>
    </label>
    <input
      v-if="freeOption && picked == freeOption.value"
      v-model="typed"
      type="text"
      maxlength="100"
      :aria-label="freeOption.label"
      placeholder="In your own words"
      class="rounded" />
  </fieldset>
</template>
