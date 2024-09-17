<script setup lang="ts">
type Props = {
  label: string;
  required?: boolean;
};
const { label, required = false } = defineProps<Props>();
</script>

<template>
  <div>
    <h3>
      {{ label }}
      <span class="text-red-600" v-if="required">*</span>
    </h3>
    <slot></slot>
  </div>
</template>
