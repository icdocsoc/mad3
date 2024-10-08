<template>
  <div>
    <p class="text-center">ID: {{ family.id }}</p>
    <CardDetails>
      <strong>Parents:</strong>
      <Student :student="family.parents[0]!" />
      <Student :student="family.parents[1]!" />
    </CardDetails>

    <CardDetails>
      <strong>Children:</strong>

      <div v-if="!family.kids.length">
        You currently have 0 kids assigned. Return to this page soon to see more
        information about your kids.
      </div>
      <div v-else>
        <Student
          v-for="kid in family.kids"
          :key="kid.shortcode"
          :student="kid" />
      </div>
    </CardDetails>
  </div>
</template>

<script setup lang="ts">
const { family } = defineProps<{ family: IFamily }>();
</script>
