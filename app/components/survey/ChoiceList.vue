<script setup lang="ts">
type Option = { value: string; label: string; free?: boolean };

const props = defineProps<{ name: string; options: readonly Option[] }>();
const model = defineModel<string | null>({ required: true });
// The words typed for an option marked `free`, such as "I am...".
const freeText = defineModel<string>('free', { default: '' });
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <label
      v-for="option in props.options"
      :key="option.value"
      class="flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-blue-50">
      <input
        v-model="model"
        type="radio"
        :name="props.name"
        :value="option.value"
        class="text-primary" />
      <span>{{ option.label }}</span>
    </label>
    <input
      v-for="option in props.options.filter(
        option => option.free && option.value == model
      )"
      :key="`${option.value}-free`"
      v-model="freeText"
      type="text"
      maxlength="100"
      :aria-label="option.label"
      placeholder="In your own words"
      class="rounded" />
  </fieldset>
</template>
