<script setup lang="ts">
type Props = {
  parent1: IStudent;
  parent2: IStudent;
  kids: IStudent[];
};

const props = defineProps<Props>();
</script>

<template>
  <Card>
    <CardTitle>Your Family</CardTitle>

    <CardDetails>
      <strong>Parents:</strong>
      <Student :student="props.parent1" />
      <Student :student="props.parent2" />
    </CardDetails>

    <CardDetails>
      <strong>Children:</strong>

      <div v-if="!props.kids.length">
        You currently have 0 kids assigned. Return to this page soon to see more
        information about your kids
      </div>
      <div v-else>
        <Student
          v-for="kid in props.kids"
          :key="kid.shortcode"
          :student="kid" />
      </div>
    </CardDetails>
  </Card>
</template>
