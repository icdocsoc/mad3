<script setup lang="ts">
type Props = {
  parent1: IStudent;
  parent2: IStudent;
  kids: IStudent[];
};

const props = defineProps<Props>();
</script>

<template>
  <h1 class="text-center">Your Family</h1>

  <h2>Parents:</h2>

  <Student :student="props.parent1" />
  <Student :student="props.parent2" />

  <h2>Children:</h2>

  <div v-if="!props.kids.length">
    You currently have 0 kids assigned. Return to this page soon to see more
    information about your kids
  </div>
  <div v-else>
    <Student v-for="kid in props.kids" :key="kid.shortcode" :student="kid" />
  </div>
</template>
