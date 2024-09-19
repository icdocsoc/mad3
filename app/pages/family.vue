<script setup lang="ts">
const parent1: IStudent = {};
const parent2: IStudent = {};
const kids: IStudent[] = [];

definePageMeta({
  middleware: ['require-auth']
});
</script>

<template>
  <Card>
    <CardTitle>Your Family</CardTitle>

    <CardDetails>
      <strong>Parents:</strong>
      <Student :student="parent1" />
      <Student :student="parent2" />
    </CardDetails>

    <CardDetails>
      <strong>Children:</strong>

      <div v-if="!kids.length">
        You currently have 0 kids assigned. Return to this page soon to see more
        information about your kids
      </div>
      <div v-else>
        <Student v-for="kid in kids" :key="kid.shortcode" :student="kid" />
      </div>
    </CardDetails>
  </Card>
</template>
