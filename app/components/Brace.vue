<script setup lang="ts">
/**
 * A status mark in DoCSoc's braces, like {ok} or {2}. Plain text rather than emoji, so it looks
 * the same on every phone. Decorative: the words next to it carry the meaning.
 */
defineProps<{
  mark: string;
  tone?: 'done' | 'todo' | 'warn';
}>();
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-block min-w-[3.5ch] whitespace-nowrap font-mono font-bold"
    :class="
      tone == 'done'
        ? 'text-primary'
        : tone == 'warn'
          ? 'text-amber-700'
          : 'text-gray-500'
    ">
    &#123;{{ mark }}&#125;
  </span>
</template>
